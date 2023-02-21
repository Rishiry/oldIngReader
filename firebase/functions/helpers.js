const vision = require("@google-cloud/vision");
const { GoogleAuth, grpc } = require("google-gax");
const { Configuration, OpenAIApi } = require("openai");
var fs = require("fs");
const Fuse = require("fuse.js");

const scan = async (image) => {
  const client = new vision.ImageAnnotatorClient();
  
  const request = {
    image: {
      content: Buffer.from(image, 'base64')
    }
  };

  const [result] = await client.textDetection(request);

  if (!result.fullTextAnnotation) {
    return false;
  }

  return result.fullTextAnnotation.text;
};

async function parseText(text) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const prompt = fs.readFileSync("./prompt.txt", "utf8");

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt + text + `\n\nIngredients 3: `,
    temperature: 0.7,
    max_tokens: 512,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  return response.data.choices[0].text;
}

function search(inputs, data) {
  const options = {
    includeScore: true,
    threshold: 0.1,
    keys: ["code", "names"],
  };

  const fuse = new Fuse(data, options);

  var results = [];

  inputs.forEach((input) => {
    var search = fuse.search(input);
    if (search.length > 0) {
      results.push(search[0].item);
    }
  });

  return results;
}

exports.scan = scan;
exports.parseText = parseText;
exports.search = search;
