# MJ Textiles Offline License Usage (Personal Guide)

This guide is for the software owner to generate and manage licenses for offline customer installations.

The app supports:
- Offline activation
- Installation-bound licensing
- Machine-bound licensing
- Expiry enforcement
- Clock rollback detection

---

## 1) One-time setup (your machine)

You need one RSA key pair:
- `private_key.pem` -> keep secret, never share
- `public_key.pem` -> provided to app for verification

### macOS (Terminal)

```bash
mkdir -p ~/mjtextiles-licensing-keys
cd ~/mjtextiles-licensing-keys

openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

### Windows (PowerShell, with OpenSSL installed)

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\mjtextiles-licensing-keys" | Out-Null
Set-Location "$env:USERPROFILE\mjtextiles-licensing-keys"

openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

If `openssl` is not found on Windows, use one of:
- Git Bash (usually has openssl)
- WSL Ubuntu (`sudo apt install openssl`)
- Install OpenSSL for Windows and add to `PATH`

---

## 2) Configure backend verifier key on customer machine

Backend must receive `LICENSE_PUBLIC_KEY_PEM` before startup.

### macOS/Linux

```bash
export LICENSE_PUBLIC_KEY_PEM="$(cat /path/to/public_key.pem)"
```

### Windows PowerShell

```powershell
$env:LICENSE_PUBLIC_KEY_PEM = Get-Content "C:\path\to\public_key.pem" -Raw
```

Then start your backend jar in the same shell.

Optional env values:
- `LICENSE_FILE_PATH` (default: `license/license.lic`)
- `LICENSE_CLOCK_ROLLBACK_TOLERANCE_MINUTES` (default: `60`)
- `LICENSE_EXPIRY_GRACE_SECONDS` (default: `300`)
- `LICENSE_MACHINE_MATCH_THRESHOLD` (default: `0.60`)

---

## 3) Get installation details from customer app

On customer machine:
1. Open app
2. Go to `/license`
3. (Optional API path) call:
   - `GET /api/v1/license/installation-id`
4. Copy:
   - `installationId`
   - `machineHash`
   - `machineFactors` (if shown)

These values are unique to that installation/machine.

---

## 4) Generate license file (your machine)

You already have the CLI in backend:
- `com.codewithshiva.retailpos.license.tool.LicenseGeneratorCli`

Build backend jar first (if needed):

```bash
cd backend
./mvnw -DskipTests package
```

Recommended flow:
1. On `/license` page, click `Download License Config Template`
2. Edit only:
   - `customerName`
   - `issuedAt`
   - `expiresAt`
3. Keep other fields unchanged (they are machine/install binding values)

Generate `.lic` from config file:

```bash
cd backend
./mvnw -q -DskipTests compile org.codehaus.mojo:exec-maven-plugin:3.5.0:java \
  -Dexec.mainClass=com.codewithshiva.retailpos.license.tool.LicenseGeneratorCli \
  -Dexec.args="--config-file=/absolute/path/license-config.json"
```

You can still override specific values from command line if needed, for example:

```bash
cd backend
./mvnw -q -DskipTests compile org.codehaus.mojo:exec-maven-plugin:3.5.0:java \
  -Dexec.mainClass=com.codewithshiva.retailpos.license.tool.LicenseGeneratorCli \
  -Dexec.args="--config-file=/absolute/path/license-config.json --output=/tmp/customer.lic"
```

Notes:
- `issued-at` and `expires-at` should be in UTC format (`...Z`) for consistency.
- Example: `2026-02-14T04:30:00.000Z`
- Send only the `.lic` file to customer (never private key).

---

## 5) Activate license on customer machine

On customer app:
1. Open `/license`
2. Upload `.lic` file (or paste JSON)
3. Click **Activate License**
4. Confirm status becomes `VALID`
5. License is stored in both:
   - DB: `app_license_state`
   - Local file: `license/license.lic`

License info is also visible in:
- `Settings -> License Information`

---

## 6) Renewal workflow

When license is close to expiry:
1. Reuse same `installationId` + machine details (or fetch fresh)
2. Generate new `.lic` with new `expires-at`
3. Customer uploads new `.lic`
4. Status updates to `VALID`

---

## 7) Expected behavior and protection

- No license -> login blocked
- Expired license -> login blocked
- Invalid signature/tampered payload -> login blocked
- License copied to different installation -> blocked
- License copied to different machine -> blocked
- Refresh token flow is also blocked when license is not valid
- System clock moved backward beyond tolerance -> `CLOCK_TAMPERED`, login blocked
- `CLOCK_TAMPERED` is not auto-cleared; reactivation is required

Default rollback tolerance is 60 minutes.

---

## 8) Windows + macOS deployment note

This licensing design works for both Windows and macOS installations:
- fingerprint uses OS/machine/network factors
- license remains installation + machine bound

You should always generate license from values reported by that exact customer installation.

---

## 9) Security rules (must follow)

- Never commit `private_key.pem` to git
- Never copy `private_key.pem` to customer machine
- Keep private key in encrypted backup
- If private key leaks, rotate keys and reissue licenses
- This protects against normal sharing/clock-backdating, but no fully offline system is 100% tamper-proof against full machine rollback attacks

---

## 10) Quick checklist per customer

1. Collect `installationId` + `machineHash`
2. Generate `.lic` with correct expiry
3. Send `.lic` to customer
4. Confirm activation status = `VALID`
5. Record expiry date for renewal follow-up

