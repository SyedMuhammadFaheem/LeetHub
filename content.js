chrome.storage.local.get(["username", "repo", "token"], function (result) {
  const username = result.username;
  const repo = result.repo;
  const token = result.token;
  const questionName = document
    .getElementsByTagName("h4")[0]
    .textContent.split(" ")
    .join("");
  let extensionName = document.getElementById("result_language").innerHTML;

  if (extensionName === "python3") extensionName = ".py";
  else if (extensionName === "python") extensionName = ".py";
  else if (extensionName === "java") extensionName = ".java";
  else if (extensionName === "cpp") extensionName = ".cpp";
  else if (extensionName === "c") extensionName = ".c";
  else if (extensionName === "cs") extensionName = ".cs";
  else if (extensionName === "js") extensionName = ".js";
  else if (extensionName === "ts") extensionName = ".ts";
  else if (extensionName === "php") extensionName = ".php";
  else if (extensionName === "swift") extensionName = ".swift";

  const fileName =
    questionName + extensionName ||
    "solution.txt" + Math.floor(Math.random() * 100);

  console.log(username, repo, token, fileName);
  const COMMIT_MESSAGE = fileName + " " + String(new Date());
  console.log(COMMIT_MESSAGE);

  const leetCodeSolutionTextarea =
    document.getElementsByClassName("ace_content");
  let newContent = "";
  for (let i = 0; i < leetCodeSolutionTextarea.length; i++) {
    const element = leetCodeSolutionTextarea[i];
    newContent = "\n" + newContent + element.textContent;
  }

  if (!newContent) {
    console.error("Failed to extract content from LeetCode solution textarea");
    return;
  }

  console.log(newContent);

  const fileData = {
    message: COMMIT_MESSAGE,
    content: btoa(newContent),
  };

  const credentials = btoa(`${username}:${token}`);

  const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${fileName}`;

  fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        fetch(apiUrl, {
          method: "PUT",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fileData),
        }).then((response) => {
          if (response.ok) console.log("File Created!");
          else throw new error("Error in creating file!");
        });
      }
    })
    .then((data) => {
      const sha = data ? data.sha : '';
      if (sha) {
        return fetch(apiUrl, {
          method: "PUT",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...fileData,
            sha: sha,
          }),
        });
      }
    })
    .then((response) => response ? response.json() : 'No SHA found')
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});
