const Page = require("./helpers/Page");

let page;

beforeEach(async () => {
  // Proxy for CustomPage, Puppeteer Page, Puppeteer Browser
  page = await Page.build();
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  // close browser(actually)
  await page.close();
});

describe("When logged in", async () => {
  beforeEach(async () => {
    // login will redirect to /blogs where we actually see + button
    await page.login();
    await page.click("a.btn-floating");
  });

  test("can see blog create form", async () => {
    const label = await page.getContentsOf("form label");

    expect(label).toEqual("Blog Title");
  });

  describe("and using valid inputs", async () => {
    beforeEach(async () => {
      await page.type(".title input", "My title");
      await page.type(".content input", "My content");
      await page.click("form button");
    });

    test("submitting takes user to review screen", async () => {
      const text = await page.getContentsOf("h5");

      expect(text).toEqual("Please confirm your entries");
    });

    test("submitting then saving adds blog to index page(/blogs)", async () => {
      await page.click("button.green");
      // wait for ajax req. to complete and get redirected to index page
      await page.waitFor(".card");

      const title = await page.getContentsOf(".card-title");
      const content = await page.getContentsOf("p");

      expect(title).toEqual("My title");
      expect(content).toEqual("My content");
    });
  });

  describe("And using invalid inputs", async () => {
    beforeEach(async () => {
      await page.click("form button");
    });

    test("the form shows an error message", async () => {
      const titleError = await page.getContentsOf(".title .red-text");
      const contentError = await page.getContentsOf(".content .red-text");

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });
});

describe("When not logged in", async () => {
  // NOTE: Since tests below are similar and we may add similar tests in future, we can use alt. approach
  // test("User cannot create blog post", async () => {
  //   const result = await page.post("/api/blogs", {
  //     title: "My Test Title",
  //     content: "My testing content"
  //   });

  //   expect(result).toEqual({ error: "You must log in!" });
  // });

  // test("User cannot get list of blogs", async () => {
  //   const result = await page.get("/api/blogs");

  //   expect(result).toEqual({ error: "You must log in!" });
  // });

  const actions = [
    {
      method: "get",
      path: "/api/blogs"
    },
    {
      method: "post",
      path: "/api/blogs",
      data: {
        title: "Title",
        content: "Content"
      }
    }
  ];

  test("Blog related actions are prohibited", async () => {
    const results = await page.execRequests(actions);

    for (const res of results) {
      expect(res).toEqual({ error: "You must log in!" });
    }
  });
});
