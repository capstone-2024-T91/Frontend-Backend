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
  return parseContent(document.querySelector(".a3s").textContent);
};

const parseContent = (emailContent) => {
  var cleanedText = emailContent.replace(/\s+/g, " ").trim();
  cleanedText = cleanedText
    .replace(
      /^.*?On \w{3}, \w{3} \d{1,2}, \d{4} at \d{1,2}(:\d{2})? (AM|PM).*$/s,
      ""
    )
    .trim();
  return cleanedText;
};

// Function to send email content to the phishing detection model
const sendEmailForAnalysis = async (emailContent) => {
  try {
    const { selectedModel = "local" } = await new Promise((resolve) =>
      chrome.storage.sync.get("selectedModel", resolve)
    );
    console.log(selectedModel);
    console.log(emailContent);
    const params = new URLSearchParams({
      email_text: emailContent,
      model_option: selectedModel,
    });
    const response = await fetch(
      `https://g30.xyz/detect_phishing?${params.toString()}`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.text();
    return data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

// Function to classify email based on predictions
const classifyEmail = (predictions) => {
  console.log('this is the ', predictions);
  console.log('this is the ', predictions.prediction == "Phishing Email");
  console.log('hello');
  if (predictions.prediction === "Phishing Email") {
    return { classification: "Danger", averageCertainty: 100 };
  } else {
    return { classification: "Safe", averageCertainty: 100 };
  }
};

// Function to add phishing detection button to the UI
const addButtonToInterface = () => {
  const sortContainer = document.querySelector("td.c2");
  if (!sortContainer) {
    console.log("Sort container not found");
    return;
  }

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
  sortContainer.appendChild(sortButton);

  sortButton.addEventListener("click", async () => {
    if (sortButton.disabled) return;
    sortButton.disabled = true;
    const emailContent = readEmailContent();
    const loadingButton = createLoadingButton();
    sortContainer.appendChild(loadingButton);

    try {
      const data = await sendEmailForAnalysis(emailContent);
      if (data) {
        loadingButton.remove();
        const resultButton = createResultButton();
        sortContainer.appendChild(resultButton);
        const consensus = classifyEmail(JSON.parse(data));
        displayResultButton(sortContainer, resultButton, consensus);
      }
    } catch (error) {
      console.error("Error during analysis:", error);
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
      if (mutation.type === "childList") {
        // Check if an email is displayed
        if (isEmailOnScreen() && !found) {
          found = true;
          addButtonToInterface();
        }
        // Reset `found` if the email is no longer displayed
        else if (!isEmailOnScreen() && found) {
          found = false;
        }
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
  loadingButton.id = "loadingButton";
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
  console.log(consensus.classification)
  if (consensus.classification === "Danger") {
    console.log("Danger");
    button.textContent = `Caution`;
    button.style.backgroundColor = "rgb(242,28,28)";
  } else if (consensus.classification === "Moderate") {
    button.textContent = `Moderate`;
    button.style.backgroundColor = "rgb(242,156,28)";
  } else {
    button.textContent = `Safe`;
    button.style.backgroundColor = "rgb(7,138,68)";
  }
  container.appendChild(button);
};

// Main execution

addKeyframesToDOM();
observeDOM();
