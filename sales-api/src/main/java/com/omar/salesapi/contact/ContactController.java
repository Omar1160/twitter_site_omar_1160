package com.omar.salesapi.contact;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin(origins = "http://localhost:4200")
public class ContactController {

    @PostMapping
    public ResponseEntity<Void> submitContact(@RequestBody ContactRequest request) {
        // Hier kun je later e-mail of database-opslag aan koppelen
        System.out.printf(
                "Nieuwe lead van %s (%s) – kanaal: %s%nBericht: %s%n",
                request.getName(),
                request.getEmail(),
                request.getChannelUrl(),
                request.getMessage()
        );

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}

