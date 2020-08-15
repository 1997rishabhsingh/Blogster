const { promisify } = require("util");
const { Query } = require("mongoose");
const { createClient } = require("redis");

const { redisUrl } = require("../config/keys");

const client = createClient(redisUrl);
client.hget = promisify(client.hget);

const exec = Query.prototype.exec;

Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || ""); // incase obj is passed as key
  return this;
};

Query.prototype.exec = async function () {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }
  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name
  });

  const cachedValue = await client.hget(this.hashKey, key);

  // NOTE: cachedValue might be single object or an array
  if (cachedValue) {
    const doc = JSON.parse(cachedValue);
    if (!Array.isArray(doc)) {
      return new this.model(doc);
    }
    return doc.map((d) => new this.model(d));
  }

  const result = await exec.apply(this, arguments);

  client.hset(this.hashKey, key, JSON.stringify(result));

  return result;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};
