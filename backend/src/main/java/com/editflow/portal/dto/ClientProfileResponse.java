package com.editflow.portal.dto;

import com.editflow.client.Client;

/** The client's own profile. Internal admin notes are deliberately not part of this type. */
public record ClientProfileResponse(Long id, String name, String email, String phone, String instagram,
                                    String companyName) {

    public static ClientProfileResponse from(Client client) {
        return new ClientProfileResponse(client.getId(), client.getName(), client.getEmail(), client.getPhone(),
                client.getInstagram(), client.getCompanyName());
    }
}
