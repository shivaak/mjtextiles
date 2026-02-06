package com.codewithshiva.retailpos.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Forwards non-API requests to index.html so that React Router
 * can handle client-side routing (e.g., browser refresh on /dashboard).
 */
@Controller
public class SpaForwardingController {

    @GetMapping(value = "/{path:^(?!api|swagger|actuator|v3|assets)[^\\.]*$}")
    public String forwardRoot() {
        return "forward:/index.html";
    }

    @GetMapping(value = "/{path:^(?!api|swagger|actuator|v3|assets)[^\\.]*$}/**")
    public String forwardNested() {
        return "forward:/index.html";
    }
}
