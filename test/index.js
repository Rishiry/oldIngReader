const vision = require('@google-cloud/vision');
const {GoogleAuth, grpc} = require('google-gax');

const apiKey = 'AIzaSyDSooG_KRn-EvHxBz6wGrCWdML__poP5SU';

function getApiKeyCredentials() {
  const sslCreds = grpc.credentials.createSsl();
  const googleAuth = new GoogleAuth();
  const authClient = googleAuth.fromAPIKey(apiKey);
  const credentials = grpc.credentials.combineChannelCredentials(
    sslCreds,
    grpc.credentials.createFromGoogleCredential(authClient)
  );
  return credentials;
}


async function vision(fileName) {
  const sslCreds = getApiKeyCredentials();
  const client = new vision.ImageAnnotatorClient({sslCreds});

  const [result] = await client.textDetection(fileName);
  console.log('Text:', result);
}

main('./example.png').then(() => console.log('done'));