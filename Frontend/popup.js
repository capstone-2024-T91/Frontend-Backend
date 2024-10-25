// Style / Animations
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
const addKeyframesToDOM = () => {
  console.log("add keyframes to DOM");
  const styleElement = document.createElement("style");
  styleElement.innerHTML = keyframes;
  document.head.appendChild(styleElement);
};

document.addEventListener("DOMContentLoaded", function () {
  // Get the dropdown element
  const modelSelect = document.getElementById("modelSelect");

  // Load the previously selected model from chrome.storage
  chrome.storage.sync.get("selectedModel", function (data) {
    if (data.selectedModel) {
      modelSelect.value = data.selectedModel; // Set the dropdown to the previously selected model
    }
  });

  // Store the selected model whenever the user changes the dropdown
  modelSelect.addEventListener("change", function () {
    const selectedModel = modelSelect.value;
    chrome.storage.sync.set({ selectedModel: selectedModel }, function () {
      console.log("Selected model saved:", selectedModel);
    });
  });
});

// Function to check if an email is displayed on the screen
const isEmailOnScreen = () => {
  return document.querySelector("td.c2") !== null;
};

// Function to read the email content
const readEmailContent = () => {
  return document.querySelector(".a3s").textContent;
};

// Function to send email content to the phishing detection model
const sendEmailForAnalysis = async (emailContent) => {
  return new Promise((resolve) => {
    chrome.storage.sync.get("selectedModel", function (data) {
      const selectedModel = data.selectedModel || "ModelA";
      const formData = new FormData();
      formData.append("experience", emailContent);
      formData.append("model", selectedModel);
      // try {
      //   const response = await fetch("https://3.14.250.99/", {
      //     method: "POST",
      //     body: formData,
      //   });
      //   if (!response.ok) {
      //     throw new Error("Network response was not ok");
      //   }
      //   const data = await response.text();
      //   return data;
      // } catch (error) {
      //   console.error("Error:", error);
      //   return null;
      // }

      // Simulate an API response
      // TODO change when we have model working with extension with right output
      setTimeout(() => {
        const result = Math.random() > 0.5 ? "phishing" : "legitimate";
        resolve(result);
      }, 1000);
    });
  });
};

// Function to parse the model's response
const parseModelResponse = (htmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const loginDiv = doc.querySelector(".login");
  const result = loginDiv.textContent.trim();
  const cleanResult = result
    .split("\n")
    .slice(10)
    .map((k) => k.trim());
  return cleanResult;
};

// Function to classify email based on predictions
const classifyEmail = (predictions) => {
  // let phishingCount = 0;
  // let phishingCountWithCertainty = 0;
  // let safeCountWithCertainty = 0;
  // let safeCertaintySum = 0;
  // let phishingCertaintySum = 0;

  // predictions.forEach((prediction) => {
  //   const certaintyMatch = prediction.match(/Certainty: ([0-9.]+)/);
  //   if (prediction.includes("Phishing Email")) {
  //     phishingCount++;
  //     if (certaintyMatch && certaintyMatch[1]) {
  //       phishingCountWithCertainty++;
  //       phishingCertaintySum += parseFloat(certaintyMatch[1]);
  //     }
  //   }
  //   if (
  //     prediction.includes("Safe Email") &&
  //     certaintyMatch &&
  //     certaintyMatch[1]
  //   ) {
  //     safeCountWithCertainty++;
  //     safeCertaintySum += parseFloat(certaintyMatch[1]);
  //   }
  // });

  // if (phishingCount === 5) {
  //   const averageCertainty =
  //     (phishingCertaintySum / phishingCountWithCertainty) * 100;
  //   return { classification: "Danger", averageCertainty };
  // } else if (phishingCount >= 3) {
  //   const averageCertainty =
  //     (phishingCertaintySum / phishingCountWithCertainty) * 100;
  //   return { classification: "Moderate", averageCertainty };
  // } else {
  //   const averageCertainty = (safeCertaintySum / safeCountWithCertainty) * 100;
  //   return { classification: "Safe", averageCertainty };
  // }

  // TODO change when we have model working with extension with right output
  if (predictions === "phishing") {
    return { classification: "Danger", averageCertainty: 80 }; // Assuming certainty is max for phishing
  } else {
    return { classification: "Safe", averageCertainty: 80 }; // Assuming certainty is max for legitimate
  }
};

// Function to add phishing detection button to the UI
const addButtonToInterface = () => {
  const sortContainer = document.querySelector("td.c2");
  if (!sortContainer) return;

  const sortButton = document.createElement("button");
  sortButton.textContent = "Phishing Risk?";
  styleButton(
    sortButton,
    "rgb(235, 236, 237)",
    "#4e4e4e",
    "4px 10px",
    "smaller"
  );
  sortButton.style.borderRadius = " 4px 0 0 4px";
  sortButton.classList.add("phishing");

  const resultButton = createResultButton();

  sortContainer.appendChild(sortButton);

  sortButton.addEventListener("click", async () => {
    const emailContent = readEmailContent();
    const loadingButton = createLoadingButton();
    sortContainer.appendChild(loadingButton);
    console.log("promise");
    const data = await sendEmailForAnalysis(emailContent);
    if (data) {
      loadingButton.remove();
      // const parsed = parseModelResponse(data);
      const consensus = classifyEmail(data);
      displayResultButton(sortContainer, resultButton, consensus);
    }
  });
};

// Function to observe changes in the DOM
let found = false;
const observeDOM = () => {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };
  const callback = (mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && isEmailOnScreen() && !found) {
            found = true;
            addButtonToInterface();
          }
        });
      }
    });
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
};

// Helper functions
const styleButton = (button, backgroundColor, color, padding, fontSize) => {
  button.style.padding = padding;
  button.style.fontSize = fontSize;
  button.style.backgroundColor = backgroundColor;
  button.style.color = color;
  button.style.border = "none";
  button.style.cursor = "pointer";
};

const createResultButton = () => {
  const resultButton = document.createElement("button");
  resultButton.id = "resultButton";
  styleButton(
    resultButton,
    "rgb(77, 77, 77)",
    "rgb(235, 236, 237)",
    "4px 10px",
    "smaller"
  );
  resultButton.style.borderRadius = " 0 4px 4px 0";
  resultButton.style.opacity = "0";
  resultButton.style.transform = "translateX(20px)";
  resultButton.style.animation = "bg1 2.4s 0s cubic-bezier(0.6, 0.1, 0.165, 1)";
  resultButton.style.animationFillMode = "forwards";
  resultButton.classList.add("phishing");
  return resultButton;
};

const createLoadingButton = () => {
  const loadingButton = document.createElement("button");
  loadingButton.style.border = "none";
  loadingButton.style.borderRadius = "0px";
  loadingButton.style.backgroundColor = "#00000000";
  loadingButton.style.fontSize = "smaller";
  loadingButton.style.opacity = "0";
  loadingButton.style.animation =
    "bg2 1s 0s cubic-bezier(0.6, 0.1, 0.165, 1), bg3 1s 1s cubic-bezier(0.6, 0.1, 0.165, 1)";
  loadingButton.style.animationFillMode = "forwards";
  loadingButton.textContent = "loading...";
  return loadingButton;
};

const displayResultButton = (container, button, consensus) => {
  console.log("adding result button");
  if (consensus.classification === "Danger") {
    console.log("Danger");
    button.textContent = `High, Risk estimate: ${consensus.averageCertainty.toPrecision(
      2
    )}%`;
    button.style.backgroundColor = "rgb(242,28,28)";
  } else if (consensus.classification === "Moderate") {
    button.textContent = `Moderate, Risk estimate: ${consensus.averageCertainty.toPrecision(
      2
    )}%`;
    button.style.backgroundColor = "rgb(242,156,28)";
  } else {
    console.log("Safe");
    button.textContent = `Low, Safety estimate: ${consensus.averageCertainty.toPrecision(
      2
    )}%`;
    button.style.backgroundColor = "rgb(7,138,68)";
  }
  container.appendChild(button);
};

// Main execution

addKeyframesToDOM();
observeDOM();

module.exports = {
  isEmailOnScreen,
  readEmailContent,
  classifyEmail,
  createResultButton,
  createLoadingButton,
  parseModelResponse,
  sendEmailForAnalysis,
};
