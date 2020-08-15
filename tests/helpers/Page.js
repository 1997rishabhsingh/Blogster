const puppeteer = require("puppeteer");

const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");

class CustomPage {
  constructor(page) {
    this.page = page;
  }

  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: function (target, property) {
        // Just because browser.close() is needed browser[property] is placed 2nd and lastly page[property] with page.close() which is not needed atm
        return customPage[property] || browser[property] || page[property];
      }
    });
  }

  async login() {
    const user = await userFactory();

    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({ name: "session", value: session });
    await this.page.setCookie({ name: "session.sig", value: sig });

    await this.page.goto("http://localhost:3000/blogs");

    // If element doesn't load, test will fail here instead of anywhere down below
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getContentsOf(selector) {
    return await this.page.$eval(selector, (el) => el.innerHTML);
  }

  get(path) {
    // 'path' cant directly be accessed since this function will be stringified. Hence to use variables u need to pass then as second arg. to page.evaluate function. Those args. will be passed to the function in the page.evaluate
    // hence path = _path
    return this.page.evaluate((_path) => {
      return fetch(_path, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        }
      }).then((res) => res.json());
    }, path);
  }

  post(path, data) {
    // path = _path, data = _data (i.e. the body of post request)
    return this.page.evaluate(
      (_path, _data) => {
        return fetch(_path, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(_data)
        }).then((res) => res.json());
      },
      path,
      data
    );
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => {
        // calling appt. method with string interpolation
        // this -> page
        return this[method](path, data);
      })
    );
  }
}

module.exports = CustomPage;
