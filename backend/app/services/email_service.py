import logging
import resend

logger = logging.getLogger(__name__)

RESET_EMAIL_SUBJECT = "Redefinição de senha — Shello"

RESET_EMAIL_HTML = """<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family: sans-serif; background: #F5F0EB; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px;">
    <h2 style="color: #5E836A;">🐢 Shello</h2>
    <p>Você solicitou a redefinição da sua senha.</p>
    <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
    <a href="{reset_url}"
       style="display:inline-block; background:#5E836A; color:#fff; padding:14px 28px;
              border-radius:24px; text-decoration:none; font-weight:bold; margin: 16px 0;">
      Redefinir senha
    </a>
    <p style="color:#888; font-size:12px;">Se você não solicitou isso, ignore este email.</p>
    <p style="color:#888; font-size:12px;">Ou copie e cole este link no navegador:<br>{reset_url}</p>
  </div>
</body>
</html>"""


class EmailService:
    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    def send_reset_email(self, to_email: str, reset_url: str) -> None:
        resend.api_key = self._api_key
        try:
            resend.Emails.send({
                "from": "Shello <onboarding@resend.dev>",
                "to": [to_email],
                "subject": RESET_EMAIL_SUBJECT,
                "html": RESET_EMAIL_HTML.format(reset_url=reset_url),
            })
            logger.info("Email de reset enviado para: [REDACTED]")
        except Exception as exc:
            print(f"[DEBUG] Resend exception: {exc}", flush=True)
            logger.error("Erro ao enviar email de reset: %s", exc)
            raise RuntimeError("Falha ao enviar email de recuperação.") from exc
