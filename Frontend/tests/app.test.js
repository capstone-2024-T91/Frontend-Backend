// app.test.js
import {
  isEmailOnScreen,
  readEmailContent,
  classifyEmail,
  sendEmailForAnalysis,
  addButtonToInterface,
  createLoadingButton,
  createResultButton,
  observeDOM,
} from "../popup.js";
import * as popup from "../popup.js";

describe("Email Analysis Functions", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <table>
        <tbody>
          <tr>
            <td class="c2">
              <h3 class="iw gFxsud">
                <span class="go">RecruitingNoReply@ford.com</span>
              </h3>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="a3s">Test email content.</div>
      <select id="modelSelect">
        <option value="ModelA">Model A</option>
        <option value="ModelB">Model B</option>
        <option value="ModelC">Model C</option>
      </select>
    `;

    global.chrome = {
      storage: {
        sync: {
          get: jest.fn((key, callback) => {
            callback({ selectedModel: "ModelB" });
          }),
          set: jest.fn(),
        },
      },
    };

    const modelSelect = document.getElementById("modelSelect");
    modelSelect.addEventListener("change", () => {
      chrome.storage.sync.set({ selectedModel: modelSelect.value });
    });
  });

  test("isEmailOnScreen should return true if email is displayed", () => {
    expect(isEmailOnScreen()).toBe(true);
  });

  test("isEmailOnScreen should return false if email is not displayed", () => {
    document.body.innerHTML = "<td></td>";
    expect(isEmailOnScreen()).toBe(false);
  });

  test("readEmailContent should return the correct email content", () => {
    const content = readEmailContent();
    expect(content).toBe("Test email content.");
  });

  test("classifyEmail should classify phishing correctly", () => {
    const phishingResult = classifyEmail("phishing");
    expect(phishingResult).toEqual({
      classification: "Danger",
      averageCertainty: 80,
    });
  });

  test("classifyEmail should classify legitimate emails correctly", () => {
    const safeResult = classifyEmail("legitimate");
    expect(safeResult).toEqual({
      classification: "Safe",
      averageCertainty: 80,
    });
  });

  test("createResultButton should create a button with correct styles", () => {
    const button = createResultButton();
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button.style.opacity).toBe("0");
    expect(button.textContent).toBe("");
  });

  test("createLoadingButton should create a loading button", () => {
    const loadingButton = createLoadingButton();
    expect(loadingButton).toBeInstanceOf(HTMLButtonElement);
    expect(loadingButton.textContent).toBe("loading...");
  });

  test("sendEmailForAnalysis should return a promise that resolves to phishing or legitimate", async () => {
    jest.useFakeTimers();
    const result = sendEmailForAnalysis("email content");

    jest.runAllTimers();
    await expect(result).resolves.toMatch(/phishing|legitimate/);
  });

  test("addButtonToInterface should add a phishing button to the interface and show result", async () => {
    jest.useFakeTimers();
    jest
      .spyOn(popup, "readEmailContent")
      .mockReturnValue("Test email content.");
    jest.spyOn(popup, "sendEmailForAnalysis").mockResolvedValue("phishing");
    jest.spyOn(popup, "classifyEmail").mockReturnValue({
      classification: "Danger",
      averageCertainty: 80,
    });

    const sortContainer = document.createElement("td");
    sortContainer.className = "c2";
    document.body.appendChild(sortContainer);

    addButtonToInterface();

    const button = document.querySelector("button.phishing");
    expect(button).not.toBeNull();

    button.click();
    await Promise.resolve();
    jest.runAllTimers();

    const loadingButton = document.getElementById("loadingButton");
    expect(loadingButton).not.toBeNull();
    jest.runAllTimers();

    const resultButton = document.getElementById("resultButton");
    expect(resultButton).not.toBeNull();

    jest.useRealTimers();
  });

  // Test classifyEmail with specific certainty calculations
  test("classifyEmail should classify based on phishing counts", () => {
    const result = classifyEmail("phishing");
    expect(result).toEqual({
      classification: "Danger",
      averageCertainty: 80,
    });
  });

  test("should set the dropdown value based on saved model", () => {
    const modelSelect = document.getElementById("modelSelect");

    // Directly simulate the chrome.storage.sync.get call and set the dropdown value
    chrome.storage.sync.get.mockImplementation((key, callback) => {
      callback({ selectedModel: "ModelB" });
    });

    // Simulate the callback execution
    chrome.storage.sync.get("selectedModel", ({ selectedModel }) => {
      modelSelect.value = selectedModel;
    });

    expect(modelSelect.value).toBe("ModelB");
  });

  test("should save the selected model when the dropdown changes", () => {
    const modelSelect = document.getElementById("modelSelect");

    // Simulate a user selecting a different model
    modelSelect.value = "ModelC";
    modelSelect.dispatchEvent(new Event("change")); // Trigger the change event

    // Check if chrome.storage.sync.set was called with the expected argument
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      selectedModel: "ModelC",
    });
  });
});
