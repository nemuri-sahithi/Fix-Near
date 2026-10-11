
package com.fixnear.Fixnear.repository;

import com.fixnear.Fixnear.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByCategoryIgnoreCaseAndLocationIgnoreCase(
            String category, String location);

}
