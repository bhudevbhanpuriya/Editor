// const languageCodeMap = {
//     cpp: 54,         // C++ (GCC 9.2)
//     python: 92,      // Python 3.8
//     javascript: 93,  // Node.js
//     java: 91         // Java OpenJDK 13
// };

// async function getSubmission(token, callback = () => {}){
//     const url = `https://ce.judge0.com/submissions/${token}?base64_encoded=true`;
//     const options = {
//         method : 'GET',
//         headers: { "Content-Type": "application/json" },
//     };
//     try {
//         const response = await fetch (url , options);
//         const result = await response.json();
//         return result;
//     }catch(error){
//         // console.log({err});
//         callback({apiStatus : 'error' , message : JSON.stringify(error)});
//     }
// }

// export async function makeSubmission(code ,input, language,  callback = () => {}) {
//     const url = "https://ce.judge0.com/submissions/?base64_encoded=true"

//     const language_id = languageCodeMap[language];

//       if (!language_id) {
//         return callback({ apiStatus: "error", message: "Invalid language selected" });
//     }

//     const httpOptions = {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//             language_id,
//             source_code: btoa(code),
//             stdin: btoa(input), // optional input later
//       })
//     }

//     try{
//         callback({apiStatus : 'loading'})
//         const response = await fetch(url , httpOptions);
//         const {token} = await response.json();

//         let statusCode = 1;
//         let apiSubmissionResponse;
//         while(statusCode === 1 || statusCode === 2){
//             try{
//                 apiSubmissionResponse = await getSubmission(token);
//                 statusCode = apiSubmissionResponse.status.id;
//             }catch(error){
//                 callback({apiStatus : error , message : JSON.stringify(error)});
//                 return
//             }   
//         }

//         if(apiSubmissionResponse){
//             callback({apiStatus : 'success' , data : apiSubmissionResponse});
//         }

//         const result = await fetch(
//             `https://ce.judge0.com/submissions/${token}?base64_encoded=true`
//         );

//         const data = await result.json();

//         return data.stdout || data.stderr || data.compile_output;
//     }
//     catch(error){
//         callback({
//             apiStatus : 'error',
//             message : JSON.stringify(error)
//         })
//     }

// }

const languageCodeMap = {
    cpp: 54,
    python: 71,
    javascript: 63,
    java: 62
};

function encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

export async function makeSubmission(code, input, language, callback = () => {}) {
    const url = "https://ce.judge0.com/submissions/?base64_encoded=true";

    const language_id = languageCodeMap[language];

    if (!language_id) {
        return callback({ apiStatus: "error", message: "Invalid language selected" });
    }

    const body = {
        language_id,
        source_code: encode(code || ""),
        stdin: encode(input || "")
    };

    console.log("Submitting:", body);
    callback({ apiStatus: "loading" });

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.json();
        console.error("POST ERROR:", err);
        return callback({ apiStatus: "error", message: JSON.stringify(err) });
    }

    const { token } = await res.json();

    if (!token) {
        return callback({ apiStatus: "error", message: "No token received from Judge0" });
    }

    let result;
    let status = 1;

    let attempts = 0;
    const maxAttempts = 40; // 40 × 250ms = 10 seconds max wait

    while ((status === 1 || status === 2) && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 250));

        const poll = await fetch(
            `https://ce.judge0.com/submissions/${token}?base64_encoded=true`
        );

        result = await poll.json();
        status = result?.status?.id;

        attempts++;
    }

    if (attempts >= maxAttempts) {
        return callback({
            apiStatus: "error",
            message: "Execution timeout from Judge0"
        });
    }

    callback({ apiStatus: "success", data: result });

    const decode = (v) => (v ? decodeURIComponent(escape(atob(v))) : "");

    return decode(result.stdout) || decode(result.stderr) || decode(result.compile_output);
}
