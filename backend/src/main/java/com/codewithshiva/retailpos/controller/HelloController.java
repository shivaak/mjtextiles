package com.codewithshiva.retailpos.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Hello", description = "Hello World endpoints")
public class HelloController {

    @GetMapping("/hello")
    @Operation(summary = "Hello World", description = "Returns a simple hello world message")
    public String helloWorld() {
        return "Hello, World!";
    }

    @GetMapping("/hello/admin")
    @Operation(summary = "Hello Admin", description = "Returns a hello admin message")
    public String helloAdmin() {
        return "Hello, Admin!";
    }
}
