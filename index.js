require('dotenv').config();    // Load environment variables from a .env file.

const { Configuration, OpenAIApi } = require("openai");    // Import OpenAI API components.
const axios = require("axios");    // Import Axios for HTTP requests.
const moment = require("moment-timezone");    // Import moment-timezone for date/time manipulation.

// Set up the OpenAI API configuration using environment variables.
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);    // Initialize OpenAI API instance.

// Define a function called lookupTime that retrieves and formats the current time for a given location.
async function lookupTime(location) {
    try {
        const response = await axios.get(`http://worldtimeapi.org/api/timezone/${location}`); // Make GET request to World Time API.
        const { datetime } = response.data;    // Extract datetime from the response.
        const dateTime = moment.tz(datetime, location).format("h:mmA"); // Format datetime in the specified timezone.
        console.log(`The current time in ${location} is ${dateTime}.`);    // Log the formatted time to the console.
    } catch (error) {
        console.error(error);    // Log any errors to the console.
    }
}

async function main() {
    // Create a chat completion using the OpenAI API.
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-0613",
        messages: [
            {role: "system", content: "You are a helpful assistant."},
            {role: "user", content: "What time is it in Beijing, China?"}
        ],
        functions: [
            {
                name: "lookupTime",
                description: "get the current time in a given location",
                parameters: {
                    type: "object",    // Specify parameter as an object.
                    properties: {
                        location: {
                            type: "string",    // Specify parameter type as a string.
                            description: "The location, e.g. Beijing, China. Should be timezone name like Asia/Shanghai"
                        }
                    },
                    required: ["location"]    // Specify location parameter as required.
                }
            }
        ],
        function_call: "auto"
    })

    // Extract the generated completion from the OpenAI API response.
    const completionResponse = completion.data.choices[0].message;
    console.log(completionResponse);

    if(!completionResponse.content) {
        const functionCallName = completionResponse.function_call.name;
        console.log("functionCallName: ", functionCallName);

        if(functionCallName === "lookupTime") {
            const completionArguments = JSON.parse(completionResponse.function_call.arguments);
            console.log("completionArguments: ", completionArguments);

            lookupTime(completionArguments.location);    // Call lookupTime with the provided location.
        }
    }
}

main();    // Call the main function to initiate the script execution.