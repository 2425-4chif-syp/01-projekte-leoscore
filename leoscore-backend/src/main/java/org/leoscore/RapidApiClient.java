package org.leoscore;

import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@RegisterRestClient(baseUri = "https://sportapi7.p.rapidapi.com/api/v1")
public interface RapidApiClient {

    @GET
    @Path("/player/events_3") // Beispiel-Endpunkt
    @Produces(MediaType.APPLICATION_JSON)
    String getDartsGames();
}
