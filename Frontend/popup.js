// Style  / Animations //
const keyframes = `
  @keyframes bg1 {
    0% {
      opacity: 0;
      transform: translateX(20px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes bg2 {
    0% {
      opacity : 0;
    }
    100% {
      opacity : 1;
    }
  }
  @keyframes bg3 {
    0% {
      opacity : 1;
    }
    100% {
      opacity : 0;
    }
  }
`;

const styleElement = document.createElement("style");
styleElement.innerHTML = keyframes;
document.head.appendChild(styleElement);

// Style / Animations //


document.addEventListener("DOMContentLoaded", function () {
  var readButton = document.getElementById("readButton");
  readButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "readText" });
    });
  });
});

// This function below is to keep checking if an email is displayed in the page, and to append a button to it.
let found = false;
// Function to observe changes in the DOM
function observeDOM() {
  // Select the target node
  var targetNode = document.body;

  // Options for the observer (check for additions to the DOM)
  var config = { childList: true, subtree: true };

  // Callback function to execute when mutations are observed
  var callback = function (mutationsList, observer) {
    for (var mutation of mutationsList) {
      if (mutation.type === "childList") {
        // Check if the target node or its subtree has added nodes
        if (mutation.addedNodes.length > 0) {
          // Iterate through added nodes to check if the target element is added
          mutation.addedNodes.forEach(function (node) {
            var sortContainer = document.querySelector("td.c2");
            var phishingButton = document.querySelector(".phishing");
            // If we exited out of the page, phishingButton will be null, therefore we make `found` false to allow the button to be added again when needed
            if (!phishingButton && found) found = false;

            // adding the button to the interface when we need to
            if (node.nodeType === 1 && sortContainer && !found) {
              found = true;
              addButtonToInterface();
            }
          });
        }
      }
    }
  };

  // Create a MutationObserver instance
  var observer = new MutationObserver(callback);
  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);
}

// Function to add your button
function addButtonToInterface() {

  // Creating the main button
  var sortButton = document.createElement("button");
  sortButton.textContent = "Phishing Risk?";
  // Styles
  sortButton.style.padding = "4px 10px";
  sortButton.style.fontSize = "smaller";
  sortButton.style.marginLeft = "18px";
  sortButton.style.backgroundColor = "rgb(235, 236, 237)";
  sortButton.style.color = "#4e4e4e";
  sortButton.style.border = "none";
  sortButton.style.cursor = "pointer";
  sortButton.style.borderRadius = "4px 0 0 4px";
  sortButton.classList.add("phishing");

  // Creating the button that shows the result
  var resultButton = document.createElement("button");
  resultButton.id = "resultButton";
  // Styles
  resultButton.style.padding = "4px 10px";
  resultButton.style.fontSize = "smaller";
  resultButton.style.backgroundColor = "rgb(77, 77, 77)";
  resultButton.style.color = "rgb(235, 236, 237)";
  resultButton.style.border = "none";
  resultButton.style.borderRadius = "0px 4px 4px 0px";
  resultButton.style.opacity = "0";
  resultButton.style.transform = "translateX(20px)";
  resultButton.style.animation = "bg1 2.4s 0s cubic-bezier(0.6, 0.1, 0.165, 1)";
  resultButton.style.animationFillMode = "forwards";
  resultButton.classList.add("phishing");

  // Find the target element to append your button
  var sortContainer = document.querySelector("td.c2");

  // Check if the parent exists
  if (sortContainer) {
    // Append the main button to the target element
    sortContainer.appendChild(sortButton);

    // Event listener for the button
    sortButton.addEventListener("click", () => {

      //When the button is clicked, we create the 'loading ...' button
      var loadingButton = document.createElement("button");
      loadingButton.style.border = "none";
      loadingButton.style.borderRadius = "0px";
      loadingButton.style.backgroundColor = "#00000000";
      loadingButton.style.fontSize = "smaller";
      loadingButton.style.opacity = "0";
      loadingButton.style.animation =
        "bg2 1s 0s cubic-bezier(0.6, 0.1, 0.165, 1), bg3 1s 1s cubic-bezier(0.6, 0.1, 0.165, 1)";
      loadingButton.style.animationFillMode = "forwards";
      loadingButton.textContent = "loading...";
      sortContainer.appendChild(loadingButton);


      // Request data with the email body
      const formData = new FormData();
      formData.append("experience", document.querySelector(".a3s").textContent);

      // Post request
      fetch("https://3.14.250.99/", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.text();
        })
        .then((data) => {
          // Removing the loading button 
          loadingButton.style.display = "None";

          // Displaying the result
          sortContainer.appendChild(resultButton);

          // Parsing data
          let parsed = parser(data);

          // Finding the consensus
          let consensus = classifyEmail(parsed);

          // Displaying the result
          if (consensus.classification == "Danger") {
            resultButton.textContent = "High, Risk estimate : " + consensus.averageCertainty.toPrecision(2) + "%";
            resultButton.style.backgroundColor = "rgb(242,28,28)";
          }
          if (consensus.classification == "Moderate") {
            resultButton.style.backgroundColor = "rgb(242,156,28)";
            resultButton.textContent = "Moderate, Risk estimate : " + consensus.averageCertainty.toPrecision(2) + "%";
          }
          if (consensus.classification == "Safe") {
            resultButton.textContent = "Low, Safety estimate : " + consensus.averageCertainty.toPrecision(2) + "%";
            resultButton.style.backgroundColor = "rgb(7,138,68)";
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });
  } else {
    // If the target element doesn't exist yet, keep observing the DOM
    observeDOM();
  }
}
observeDOM();

//Parse the result from the api call, extracting only the models
const parser = (htmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const loginDiv = doc.querySelector(".login");
  let result = loginDiv.textContent.trim();
  let cleanResult = result
    .split("\n")
    .slice(10)
    .map((k) => k.trim());
  return cleanResult;
};

function classifyEmail(predictions) {
  let phishingCount = 0;
  let phishingCountWithCertainty = 0;
  let safeCountwithCertainty = 0;
  let safeCertaintySum = 0;
  let phishingCertaintySum = 0;

  for (let i = 1; i < predictions.length; i += 1) {
    if (predictions[i].includes("Phishing Email")) {
      const certaintyLine = predictions[i];
      const certaintyMatch = certaintyLine.match(/Certainty: ([0-9.]+)/);
      phishingCount++;
      if (certaintyMatch && certaintyMatch[1]) {
        phishingCountWithCertainty++;
        const certainty = parseFloat(certaintyMatch[1]);
        phishingCertaintySum += certainty;
      }
    }
    if (predictions[i].includes("Safe Email")) {
      const certaintyLine = predictions[i];
      const certaintyMatch = certaintyLine.match(/Certainty: ([0-9.]+)/);
      if (certaintyMatch && certaintyMatch[1]) {
        safeCountwithCertainty++;
        const certainty = parseFloat(certaintyMatch[1]);
        safeCertaintySum += certainty;
      }
    }
  }
  if (phishingCount == 5) {
    const averageCertainty =
      (phishingCertaintySum / phishingCountWithCertainty) * 100;
    return { classification: "Danger", averageCertainty };
  } else if (phishingCount >= 3) {
    const averageCertainty =
      (phishingCertaintySum / phishingCountWithCertainty) * 100;
    return { classification: "Moderate", averageCertainty };
  } else {
    const averageCertainty = (safeCertaintySum / safeCountwithCertainty) * 100;
    return { classification: "Safe", averageCertainty: averageCertainty };
  }
}
