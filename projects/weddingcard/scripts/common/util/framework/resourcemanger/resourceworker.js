const ENCRYPTED_IMAGE_KEY_HEX = "be87ef702c204af49131773c07cb4e827f7b5a7792fc409b268906c6fbc20970";
const ENCRYPTED_IMAGE_MAGIC = "WCIMG1";
let encryptedImageKeyPromise = null;

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

function getImageMime(url) {
    const lower = String(url || "").toLowerCase();
    if (lower.includes(".png")) {
        return "image/png";
    }
    return "image/jpeg";
}

function getEncryptedImageKey() {
    if (encryptedImageKeyPromise == null) {
        encryptedImageKeyPromise = crypto.subtle.importKey(
            "raw",
            hexToBytes(ENCRYPTED_IMAGE_KEY_HEX),
            "AES-GCM",
            false,
            ["decrypt"]
        );
    }
    return encryptedImageKeyPromise;
}

async function decryptImageBytes(bytes, url) {
    const magic = new TextDecoder().decode(bytes.slice(0, ENCRYPTED_IMAGE_MAGIC.length));
    if (magic !== ENCRYPTED_IMAGE_MAGIC) {
        return new Blob([bytes], { type: getImageMime(url) });
    }

    const ivStart = ENCRYPTED_IMAGE_MAGIC.length;
    const ivEnd = ivStart + 12;
    const iv = bytes.slice(ivStart, ivEnd);
    const encrypted = bytes.slice(ivEnd);
    const key = await getEncryptedImageKey();
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
    return new Blob([plain], { type: getImageMime(url) });
}

self.addEventListener("message", async event => {
    const payload = typeof event.data === "string"
        ? { imgUrl: event.data, requestUrl: event.data }
        : event.data;
    const imgUrl = payload.imgUrl;
    const requestUrl = payload.requestUrl || payload.imgUrl;
    const response = await fetch(requestUrl);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const blob = await decryptImageBytes(bytes, imgUrl);

    self.postMessage({
        imgUrl: imgUrl,
        blob: blob,
    });
});