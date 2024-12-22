import React, { useState } from "react";
import { render } from "react-dom";
import './popup.css';

function Popup() {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form,setform] = useState(false)
  const [formdata, setformdata] = useState({ question: "" });

  const summarizePage = async (e) => {
    if (e) e.preventDefault()
    setLoading(true);
    setError("");
    setSummary("");

    try {  
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab.url;

     
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: extractContent
        },
        async (injectionResults) => {
          const content = injectionResults[0].result; 

          if (!content) {
            setError("No content found on the page.");
            setLoading(false);
            return;
          }
         
          const prompt = formdata.question
          ? `Answer this question: "${formdata.question}" using this context: ${content}`
          : `Summarize this context in about 200 words: ${content}`;

        try{
            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API KEY}", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  "contents": [
                    {
                      "parts": [
                        {
                          "text": prompt
                        }
                      ]
                    }
                  ]
                })
              }
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch summary. Status: ${response.status}`);
            }

            const data = await response.json();
            const result = data.candidates[0].content.parts[0].text || "No summary available.";
            setSummary(result);
            setLoading(false) 
            setform(false)
            setformdata({ question: "" })
              
          } catch (error) {
            console.log("API error:", error);
            setError("An error occurred while summarizing.");
            setLoading(false)
            setformdata({ question: "" })
          } 
        }
      );
    } catch (error) {
      console.error("Error occurred in summarizePage:", error);
      setError("An error occurred while summarizing.");
      setLoading(false);
    }
  };  
 
  const handlechange = (e) => {
      setformdata({...formdata,[e.target.name]:e.target.value})
  }

  return (
    <div className="container">
      <h1 className="title">SummarEase</h1>
      <button onClick={summarizePage} className="button">
        Summarize
      </button>

      <button onClick={() => setform(!form)} className="form">Ask Question</button> 

      {form === true && (
        <form className = "question" onSubmit ={summarizePage}>
            <input
        type="text"
        id="question"
        name="question"
        placeholder="SHOOT"
        value={formdata.question}
        onChange={handlechange} 
      /> 
      <button type ="submit">SUBMIT</button>
        </form>
      )}

      {loading && <p className="loading">Loading summary...</p>}
      {error && <p className="error">{error}</p>}
      {summary && (
        <div className="summary-box">
          <h2 className="summary-title">Answer:</h2>
          <p className="summary-text">{summary}</p>
        </div>
      )}
    </div>
  );
}

function extractContent() {
  return document.body.innerText || document.body.textContent;
}

render(<Popup />, document.getElementById("popup-root"));
