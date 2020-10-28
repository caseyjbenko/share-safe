import { box, randomBytes } from "tweetnacl";
import {
  decodeUTF8,
  encodeUTF8,
  encodeBase64,
  decodeBase64,
} from "tweetnacl-util";

const newNonce = () => randomBytes(box.nonceLength);

export const generateKeyPair = () => { 
  const { publicKey, secretKey } = box.keyPair(); 
  return {
    publicKey: encodeBase64(publicKey),
    secretKey: encodeBase64(secretKey),
  }
}

const encrypt = (
  secretOrSharedKey: Uint8Array,
  message: string,
  key?: Uint8Array
) => {
  const nonce = newNonce();
  const messageUint8 = decodeUTF8(message);
  const encrypted = key
    ? box(messageUint8, nonce, key, secretOrSharedKey)
    : box.after(messageUint8, nonce, secretOrSharedKey);

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  const base64FullMessage = encodeBase64(fullMessage);
  return base64FullMessage;
};

const decrypt = (
  secretOrSharedKey: Uint8Array,
  messageWithNonce: string,
  key?: Uint8Array
) => {
  const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(
    box.nonceLength,
    messageWithNonce.length
  );

  const decrypted = key
    ? box.open(message, nonce, key, secretOrSharedKey)
    : box.open.after(message, nonce, secretOrSharedKey);

  if (!decrypted) {
    throw new Error("Could not decrypt message");
  }

  const base64DecryptedMessage = encodeUTF8(decrypted);
  return base64DecryptedMessage;
};

export const encryptSecret = (message: string, senderSecretKey: string, recipientPublicKey: string) => {
  const secretKey = decodeBase64(senderSecretKey);
  const publicKey = decodeBase64(recipientPublicKey);

  const encryptedMessage = encrypt(secretKey, message, publicKey);
  return encryptedMessage;
}

export const decryptSecret = (secret: string, recipientSecretKey: string, senderPublicKey: string) => {
  const secretKey = decodeBase64(recipientSecretKey);
  const publicKey = decodeBase64(senderPublicKey);

  const decryptedMessage = decrypt(secretKey, secret, publicKey);
  return decryptedMessage;
}