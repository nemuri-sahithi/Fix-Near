
package com.fixnear.Fixnear.controller;

import com.fixnear.Fixnear.model.Complaint;
import com.fixnear.Fixnear.repository.ComplaintRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "http://localhost:5173")
public class ComplaintController {

    private final ComplaintRepository repository;

    public ComplaintController(ComplaintRepository repository) {
        this.repository = repository;
    }

    // CREATE A NEW COMPLAINT
    @PostMapping
    public Object createComplaint(@RequestBody Complaint complaint) {

        if (complaint.getLocation() == null
                || complaint.getLocation().isBlank()) {
            return Map.of(
                    "error", true,
                    "message", "Please enter a location."
            );
        }

        // Default category
        if (complaint.getCategory() == null
                || complaint.getCategory().isBlank()) {
            complaint.setCategory("General");
        }

        String category = complaint.getCategory().trim();
        String location = complaint.getLocation().trim();

        complaint.setCategory(category);
        complaint.setLocation(location);

        // Duplicate detection
        List<Complaint> existingComplaints =
                repository.findByCategoryIgnoreCaseAndLocationIgnoreCase(
                        category, location
                );

        if (!existingComplaints.isEmpty()) {
            return Map.of(
                    "duplicate", true,
                    "message",
                    "A complaint for this category and location already exists."
            );
        }

        // Default status
        if (complaint.getStatus() == null
                || complaint.getStatus().isBlank()) {
            complaint.setStatus("Pending");
        }

        // Default verification status
        if (complaint.getVerificationStatus() == null
                || complaint.getVerificationStatus().isBlank()) {
            complaint.setVerificationStatus("Not Submitted");
        }

        // Automatic department assignment
        complaint.setDepartment(assignDepartment(complaint));

        // Priority handling
        String selectedPriority = complaint.getPriority();

        if (hasSeriousDanger(complaint)) {
            complaint.setPriority("High");
        } else if ("High".equalsIgnoreCase(selectedPriority)) {
            complaint.setPriority("High");
        } else if ("Low".equalsIgnoreCase(selectedPriority)) {
            complaint.setPriority("Low");
        } else {
            complaint.setPriority("Medium");
        }

        return repository.save(complaint);
    }

    // GET ALL COMPLAINTS
    @GetMapping
    public List<Complaint> getAllComplaints() {
        return repository.findAll();
    }

    // UPDATE COMPLAINT STATUS
    @PatchMapping("/{id}/status")
    public Complaint updateStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request) {

        Complaint complaint = findComplaint(id);

        String status = request.getStatus();

        if (status == null
                || !(status.equals("Pending")
                || status.equals("In Progress")
                || status.equals("Resolved"))) {
            throw new IllegalArgumentException(
                    "Status must be Pending, In Progress, or Resolved."
            );
        }

        complaint.setStatus(status);

        // Reset verification if work is reopened
        if (!"Resolved".equals(status)) {
            complaint.setVerificationStatus("Not Submitted");
            complaint.setCitizenFeedback(null);
        } else if (complaint.getVerificationStatus() == null) {
            complaint.setVerificationStatus("Pending Verification");
        }

        return repository.save(complaint);
    }

    // SAVE RESOLUTION PROOF PATH
    @PostMapping("/{id}/resolution-proof")
    public Object submitResolutionProof(
            @PathVariable Long id,
            @RequestBody ResolutionProofRequest request) {

        Complaint complaint = findComplaint(id);

        if (request.getResolutionProof() == null
                || request.getResolutionProof().isBlank()) {
            return Map.of(
                    "error", true,
                    "message", "Please provide a resolution-proof image path."
            );
        }

        if (!"Resolved".equals(complaint.getStatus())) {
            return Map.of(
                    "error", true,
                    "message",
                    "The complaint must be marked Resolved before proof is submitted."
            );
        }

        complaint.setResolutionProof(request.getResolutionProof().trim());
        complaint.setVerificationStatus("Pending Verification");
        complaint.setCitizenFeedback(null);

        return repository.save(complaint);
    }

    // CITIZEN VERIFICATION
    @PatchMapping("/{id}/verify")
    public Object verifyResolution(
            @PathVariable Long id,
            @RequestBody VerificationRequest request) {

        Complaint complaint = findComplaint(id);

        String decision = request.getDecision();

        if (decision == null
                || !(decision.equals("Verified")
                || decision.equals("Not Fixed"))) {
            return Map.of(
                    "error", true,
                    "message",
                    "Decision must be Verified or Not Fixed."
            );
        }

        if (complaint.getResolutionProof() == null
                || complaint.getResolutionProof().isBlank()) {
            return Map.of(
                    "error", true,
                    "message",
                    "The officer must submit resolution proof first."
            );
        }

        if (!"Resolved".equals(complaint.getStatus())) {
            return Map.of(
                    "error", true,
                    "message",
                    "Only resolved complaints can be verified."
            );
        }

        complaint.setVerificationStatus(decision);

        if (request.getFeedback() != null) {
            complaint.setCitizenFeedback(request.getFeedback().trim());
        }

        // If the citizen reports that the issue is not fixed,
        // reopen the complaint for further work.
        if ("Not Fixed".equals(decision)) {
            complaint.setStatus("In Progress");
        }

        return repository.save(complaint);
    }

    // FIND COMPLAINT BY ID
    private Complaint findComplaint(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Complaint not found: " + id));
    }

    // AUTOMATIC DEPARTMENT ASSIGNMENT
    private String assignDepartment(Complaint complaint) {

        String category = complaint.getCategory() == null
                ? "" : complaint.getCategory().toLowerCase();

        String title = complaint.getTitle() == null
                ? "" : complaint.getTitle().toLowerCase();

        String description = complaint.getDescription() == null
                ? "" : complaint.getDescription().toLowerCase();

        String text = category + " " + title + " " + description;

        if (containsAny(text,
                "garbage", "waste", "dustbin",
                "rubbish", "sanitation", "overflowing trash")) {
            return "Sanitation";
        }

        if (containsAny(text,
                "streetlight", "street light",
                "electricity", "electrical",
                "exposed wire", "power outage",
                "electric shock", "live wire")) {
            return "Electrical";
        }

        if (containsAny(text,
                "water leakage", "water leak",
                "burst pipe", "water supply",
                "drainage", "sewage", "sewer")) {
            return "Water Supply";
        }

        if (containsAny(text,
                "pothole", "damaged road",
                "broken road", "road damage",
                "footpath", "pavement")) {
            return "Roads";
        }

        if (containsAny(text,
                "park", "tree", "fallen branch",
                "public garden")) {
            return "Parks and Horticulture";
        }

        return "General/Public Works";
    }

    private boolean containsAny(
            String text, String... keywords) {

        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    // AUTOMATIC HIGH PRIORITY FOR SERIOUS DANGER KEYWORDS
    private boolean hasSeriousDanger(Complaint complaint) {

        String title = complaint.getTitle() == null
                ? "" : complaint.getTitle();

        String description = complaint.getDescription() == null
                ? "" : complaint.getDescription();

        String text = (title + " " + description).toLowerCase();

        String[] highKeywords = {
                "emergency",
                "dangerous",
                "fire",
                "electric shock",
                "exposed wire",
                "accident",
                "burst pipe",
                "severe flooding",
                "gas leak",
                "building collapse",
                "live wire",
                "electrical sparks"
        };

        for (String keyword : highKeywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    // STATUS REQUEST
    public static class StatusRequest {
        private String status;

        public StatusRequest() {
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    // RESOLUTION PROOF REQUEST
    public static class ResolutionProofRequest {
        private String resolutionProof;

        public ResolutionProofRequest() {
        }

        public String getResolutionProof() {
            return resolutionProof;
        }

        public void setResolutionProof(String resolutionProof) {
            this.resolutionProof = resolutionProof;
        }
    }

    // CITIZEN VERIFICATION REQUEST
    public static class VerificationRequest {
        private String decision;
        private String feedback;

        public VerificationRequest() {
        }

        public String getDecision() {
            return decision;
        }

        public void setDecision(String decision) {
            this.decision = decision;
        }

        public String getFeedback() {
            return feedback;
        }

        public void setFeedback(String feedback) {
            this.feedback = feedback;
        }
    }
}
