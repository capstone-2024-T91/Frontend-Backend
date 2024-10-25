// app.test.js
const {
  isEmailOnScreen,
  readEmailContent,
  classifyEmail,
  createResultButton,
  createLoadingButton,
  parseModelResponse,
  sendEmailForAnalysis,
} = require("../popup"); // Adjust the path based on your file structure

describe("Email Analysis Functions", () => {
  beforeEach(() => {
    // Set up a mock DOM environment before each test
    document.body.innerHTML = `
      <div>
        <td class="c2"></td>
        <select id="modelSelect"></select>
        <div class="a3s">Test email content</div>
      </div>
    `;
  });

  test("isEmailOnScreen should return true if email is displayed", () => {
    expect(isEmailOnScreen()).toBe(true);
  });

  test("isEmailOnScreen should return false if email is not displayed", () => {
    document.body.innerHTML = "<td></td>"; // Simulate no email on screen
    expect(isEmailOnScreen()).toBe(false);
  });

  test("readEmailContent should return the correct email content", () => {
    const content = readEmailContent();
    expect(content).toBe("Test email content"); // Update expected value
  });

  test("classifyEmail should classify phishing correctly", () => {
    const phishingResult = classifyEmail("phishing");
    expect(phishingResult).toEqual({
      classification: "Danger",
      averageCertainty: 80,
    });

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

  test("parseModelResponse should return the correct result", () => {
    const result = parseModelResponse('<div class="login">Safe Email</div>');
    expect(result).toEqual(["Safe Email"]);
  });

  test("sendEmailForAnalysis should return a promise that resolves to phishing or legitimate", async () => {
    jest.useFakeTimers(); // Use fake timers to control setTimeout
    const result = sendEmailForAnalysis("email content");

    jest.runAllTimers(); // Run all timers
    await expect(result).resolves.toMatch(/phishing|legitimate/);
  });
});
