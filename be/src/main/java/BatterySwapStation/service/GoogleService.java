package BatterySwapStation.service;

import BatterySwapStation.dto.GoogleUserInfo;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
public class GoogleService {

    @Value("${google.client.id}")
    private String googleClientId;

    public GoogleUserInfo verifyAndExtract(String idTokenString) throws GeneralSecurityException, IOException {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                new GsonFactory()
        ).setAudience(Collections.singletonList(googleClientId)).build();

        GoogleIdToken idToken = verifier.verify(idTokenString);
        if (idToken == null) throw new IllegalArgumentException("Token Google không hợp lệ");

        GoogleIdToken.Payload payload = idToken.getPayload();
        String name = (String) payload.get("name");
        String email = payload.getEmail();
        boolean emailVerified = Boolean.TRUE.equals(payload.getEmailVerified());

        return new GoogleUserInfo(name, email, emailVerified);
    }
}
