package BatterySwapStation.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.RequiredArgsConstructor;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${SENDGRID_API_KEY}")
    private String sendGridApiKey;

    @Value("${SPRING_MAIL_FROM}")
    private String fromEmail;


    //
    public void sendVerificationEmail(String fullName, String email, String verifyUrl) {
        String htmlContent = getHtmlTemplate(fullName, verifyUrl);

        Email from = new Email(fromEmail);
        Email recipient = new Email(email);
        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, "Xác minh tài khoản Battery Swap Station", recipient, content);

        sendMail(mail);
    }

    // email qua SendGrid
    private void sendMail(Mail mail) {
        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);

            int statusCode = response.getStatusCode();
            System.out.println("📧 SendGrid Response Code: " + statusCode);
            System.out.println("📧 SendGrid Response Body: " + response.getBody());
            System.out.println("📧 SendGrid Response Headers: " + response.getHeaders());

        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi gửi email qua SendGrid: " + e.getMessage(), e);
        }
    }


    // HTML Template
    private String getHtmlTemplate(String fullName, String verifyUrl) {
        String safeFullName = StringEscapeUtils.escapeHtml4(fullName);
        String safeUrl = StringEscapeUtils.escapeHtml4(verifyUrl);

        String htmlContent = """
                    <div style="font-family:Arial,sans-serif;line-height:1.6">
                        <h2 style="color:#007bff;">Xin chào, %s 👋</h2>
                        <p>Cảm ơn bạn đã đăng ký tài khoản tại <b>Battery Swap Station</b>.</p>
                        <p>Vui lòng nhấp vào nút bên dưới để xác minh email của bạn:</p>
                        <p>
                            <a href="%s" style="background-color:#28a745;color:white;
                                padding:10px 20px;text-decoration:none;border-radius:5px;">
                                Xác minh ngay
                            </a>
                        </p>
                        <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
                        <hr>
                        <p style="font-size:12px;color:gray;">
                            © 2025 Battery Swap Station Team
                        </p>
                    </div>
                """.formatted(safeFullName, safeUrl);
        return htmlContent;

    }

    public void sendEmail(String to, String subject, String htmlContent) {
        Email from = new Email(fromEmail);
        Email recipient = new Email(to);
        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, subject, recipient, content);
        sendMail(mail);
    }

}
