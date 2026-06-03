<?php
namespace Core;

/**
 * Mailer — envoi d'emails via SMTP (sans dépendance externe).
 * Configure SMTP_* dans backend/.env
 * Pour Gmail : activer "Mots de passe d'application" dans votre compte Google.
 */
class Mailer
{
    private static function cfg(string $key, string $default = ''): string
    {
        return $_ENV[$key] ?? $default;
    }

    /**
     * Envoi principal — essaie SMTP si configuré, sinon php mail() en fallback.
     */
    public static function send(string $to, string $subject, string $html): bool
    {
        $host = self::cfg('SMTP_HOST');

        if ($host) {
            try {
                return self::sendSmtp($to, $subject, $html);
            } catch (\Throwable $e) {
                error_log('[Mailer] SMTP failed: ' . $e->getMessage());
            }
        }

        // Fallback : php mail() (fonctionne sur serveur de prod avec sendmail)
        $boundary = md5(uniqid());
        $headers  = implode("\r\n", [
            'From: ShoeBox <' . self::cfg('MAIL_FROM', 'noreply@shoebox.fr') . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
        ]);

        return (bool) @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $html, $headers);
    }

    /**
     * Connexion SMTP via socket PHP (TLS STARTTLS sur port 587 ou SSL sur 465).
     */
    private static function sendSmtp(string $to, string $subject, string $html): bool
    {
        $host     = self::cfg('SMTP_HOST');
        $port     = (int) self::cfg('SMTP_PORT', '587');
        $user     = self::cfg('SMTP_USER');
        $pass     = self::cfg('SMTP_PASS');
        $from     = self::cfg('MAIL_FROM', $user);
        $fromName = self::cfg('MAIL_FROM_NAME', 'ShoeBox');
        $enc      = strtolower(self::cfg('SMTP_ENCRYPTION', 'tls')); // 'tls', 'ssl', or ''

        // Ouvrir la connexion
        $socket = null;
        if ($enc === 'ssl') {
            $socket = @stream_socket_client("ssl://{$host}:{$port}", $errno, $errstr, 15);
        } else {
            $socket = @stream_socket_client("tcp://{$host}:{$port}", $errno, $errstr, 15);
        }

        if (!$socket) throw new \RuntimeException("SMTP connect failed: $errstr ($errno)");

        stream_set_timeout($socket, 15);

        $read = fn() => fgets($socket, 1024);
        $send = function(string $cmd) use ($socket, $read): string {
            fwrite($socket, $cmd . "\r\n");
            return $read();
        };

        $read(); // banner

        $send("EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));

        // STARTTLS si mode tls
        if ($enc === 'tls') {
            $send("STARTTLS");
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            $send("EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
        }

        // Authentification
        if ($user && $pass) {
            $send("AUTH LOGIN");
            $send(base64_encode($user));
            $r = $send(base64_encode($pass));
            if (!str_starts_with($r, '235')) {
                throw new \RuntimeException("SMTP auth failed: $r");
            }
        }

        $send("MAIL FROM:<{$from}>");
        $send("RCPT TO:<{$to}>");
        $send("DATA");

        // En-têtes + corps
        $date    = date('r');
        $msgId   = '<' . md5(uniqid()) . '@shoebox.fr>';
        $encSubj = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $encFrom = '=?UTF-8?B?' . base64_encode($fromName) . '?=';

        $body = implode("\r\n", [
            "Date: {$date}",
            "Message-ID: {$msgId}",
            "From: {$encFrom} <{$from}>",
            "To: {$to}",
            "Subject: {$encSubj}",
            "MIME-Version: 1.0",
            "Content-Type: text/html; charset=UTF-8",
            "Content-Transfer-Encoding: base64",
            "",
            chunk_split(base64_encode($html)),
            ".",
        ]);

        fwrite($socket, $body . "\r\n");
        $r = $read();

        $send("QUIT");
        fclose($socket);

        return str_starts_with(trim($r), '2');
    }

    /**
     * Template HTML pour l'email de réinitialisation.
     */
    public static function resetPasswordHtml(string $name, string $resetUrl): string
    {
        $year = date('Y');
        return <<<HTML
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
            <tr><td align="center">
              <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:580px;">

                <!-- Header -->
                <tr>
                  <td style="background:#111;padding:28px 40px;text-align:center;">
                    <span style="color:#fff;font-size:24px;font-weight:800;letter-spacing:2px;">SB.</span>
                    <span style="color:#aaa;font-size:13px;display:block;margin-top:4px;">SHOEBOX</span>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px 40px 24px;">
                    <h1 style="font-size:22px;color:#111;margin:0 0 16px;font-weight:800;">
                      Réinitialisation de votre mot de passe
                    </h1>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
                      Bonjour <strong>{$name}</strong>,
                    </p>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">
                      Vous avez demandé à réinitialiser le mot de passe de votre compte ShoeBox.
                      Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
                      Ce lien est valable <strong>1 heure</strong>.
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                      <tr>
                        <td style="background:#c91310;border-radius:10px;">
                          <a href="{$resetUrl}"
                             style="display:block;padding:14px 36px;color:#fff;font-weight:700;font-size:15px;text-decoration:none;">
                            Réinitialiser mon mot de passe
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
                      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                      <a href="{$resetUrl}" style="color:#c91310;word-break:break-all;">{$resetUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;"></td></tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px 32px;text-align:center;">
                    <p style="color:#aaa;font-size:12px;margin:0;">
                      Si vous n'avez pas fait cette demande, ignorez cet e-mail. Votre mot de passe restera inchangé.<br>
                      © {$year} ShoeBox Ltd. Tous droits réservés.
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
        HTML;
    }
}
