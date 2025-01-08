package org.leoscore.service;

import javax.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.leoscore.RapidApiClient;

@ApplicationScoped
public class DartsService {

    @RestClient
    RapidApiClient rapidApiClient;

    public String getDartsGames() {
        return rapidApiClient.getDartsGames();
    }
}
