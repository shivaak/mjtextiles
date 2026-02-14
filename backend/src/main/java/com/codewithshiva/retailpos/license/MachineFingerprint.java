package com.codewithshiva.retailpos.license;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MachineFingerprint {
    private String machineHash;
    private Map<String, String> factorHashes;
}

