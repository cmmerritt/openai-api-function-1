// Load environment variables from a .env file using dotenv.
require('dotenv').config();

// Import necessary components from the OpenAI package.
const { OpenAI } = require("openai");
// Import Axios for making HTTP requests.
const axios = require("axios");
// Import moment-timezone for time manipulation in different time zones.
const moment = require("moment-timezone");

// Set up the configuration for the OpenAI API using environment variables.
// const configuration = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// });

// Initialize an OpenAI API instance.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function that fetches and formats the current time for a given location.
async function lookupTime(location) {
    try {
        // Make a GET request to the World Time API for the specified location.
        const response = await axios.get(`http://worldtimeapi.org/api/timezone/${location}`);
        // Extract datetime information from the API response.
        const { datetime } = response.data;
        // Format the datetime in the specified location's timezone using moment-timezone.
        const dateTime = moment.tz(datetime, location).format("h:mmA");
        // Display the formatted time in the console.
        console.log(`The current time in ${location} is ${dateTime}.`);
    } catch (error) {
        // Log any errors that occur during the process.
        console.error(error);
    }
}

// Main function to interact with the OpenAI GPT-3 model and execute the function calls.
async function main() {
    // Create a chat completion using the defined messages and function interactions.
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {role: "system", content: "You are a helpful assistant."},
            {role: "user", content: "What time is it in Beijing, China?"}
        ],
        functions: [
            // Add a function definition for lookupTime to fetch the current time in a given location.
            {
                name: "lookupTime",
                //Description needs to be very specific so ChatGPT knows what this function does and whether it needs to run it before responding to a prompt
                description: "get the current time in a given location",
                parameters: {
                    type: "object",
                    properties: {
                        location: {
                            type: "string",
                            description: "The location, e.g. Beijing, China. Should be timezone name like Asia/Shanghai"
                        }
                    },
                    required: ["location"]
                }
            }
        ],
        function_call: "auto"
    });

    // Extract the response from the completion generated by the OpenAI API.
    const completionResponse = completion.data.choices[0].message;
    console.log(completionResponse);

    // Check if a function call needs to be processed in the completion response.
    if (!completionResponse.content) {
        const functionCallName = completionResponse.function_call.name;
        console.log("functionCallName: ", functionCallName);

        // If the function call is for lookupTime, extract the arguments and call the function.
        if (functionCallName === "lookupTime") {
            const completionArguments = JSON.parse(completionResponse.function_call.arguments);
            console.log("completionArguments: ", completionArguments);

            // Call the lookupTime function with the specified location.
            lookupTime(completionArguments.location);
        }
    }
}

// Initiate the main function to start the script execution.
main();