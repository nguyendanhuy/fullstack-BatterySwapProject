package BatterySwapStation.controller;

import BatterySwapStation.dto.RoleDTO;
import BatterySwapStation.entity.Role;
import BatterySwapStation.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleRepository roleRepository;

    // GET /api/roles
    @GetMapping
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        List<RoleDTO> data = roleRepository.findAll()
                .stream()
                .map(r -> new RoleDTO(r.getRoleId(), r.getRoleName()))
                .toList();
        return ResponseEntity.ok(data);
    }

    // POST /api/roles
    @PostMapping
    public ResponseEntity<?> createRole(@RequestBody RoleDTO req) {
        if (roleRepository.existsByRoleName(req.getRoleName())) {
            return ResponseEntity.badRequest().body("RoleName đã tồn tại");
        }

        Role role = new Role();
        role.setRoleName(req.getRoleName());
        Role saved = roleRepository.save(role);

        return ResponseEntity.ok(new RoleDTO(saved.getRoleId(), saved.getRoleName()));
    }

    // PUT /api/roles/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRole(@PathVariable Integer id, @RequestBody RoleDTO req) {
        return roleRepository.findById(id)
                .map(role -> {
                    role.setRoleName(req.getRoleName());
                    Role updated = roleRepository.save(role);
                    return ResponseEntity.ok(new RoleDTO(updated.getRoleId(), updated.getRoleName()));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}



