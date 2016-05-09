'use strict';

import Morph from './Morph.js';
import { search as githubSearch } from '../../src/client/search/github-search.js';
import { getSearchableFileNames as getDbFileNames } from '../../src/client/search/dropbox-search.js';

export default class SearchBar extends Morph {

  initialize() {
    this.searchButton = this.getSubmorph("#searchButton");
    this.setupButton = this.getSubmorph("#setupButton");
    this.searchField = this.getSubmorph("#searchField");
    this.searchResults = this.getSubmorph("#searchResults");

    this.searchButton.addEventListener("click", (evt) => { this.searchButtonClicked() });
    this.setupButton.addEventListener("click", (evt) => { this.setup() });
    this.searchField.addEventListener("keyup", (evt) => { this.searchFieldKeyup(evt) });

    this.searchableMounts = {
      "dropbox": [],
      "github": []
    };

    this.setup();
  }

  setup() {
    this.findAvailableMounts();
  }

  searchButtonClicked() {
    let query = this.searchField.value;
    this.search(query);
  }

  searchFieldKeyup(evt) {
    // enter
    if (evt.keyCode == 13) {
      let query = this.searchField.value;
      this.search(query);
    }
  }

  async search(query) {
    console.log("[Search] searching for '" + query + "'");

    let dbFileNames = await getDbFileNames(this.searchableMounts.dropbox[0].options);
    console.log(JSON.stringify(dbFileNames));

    let results = []
    if (this.searchableMounts.dropbox.length > 0) {
      results = results.concat(await this.searchableMounts.dropbox[0].find(query));
    }
    results = results.concat(await this.searchableMounts.github[0].find(query, this.searchableMounts.github[0].options));

    this.searchResults.show(results);
  }

  findAvailableMounts() {
    $.ajax({
        url: "https://lively4/sys/mounts",
        type: 'GET',
        success: (text) => {
          var mounts = JSON.parse(text);
          console.log(mounts);
          var mountsList = this.getSubmorph("#mounts-list");
          mountsList.innerHTML = "";
          mounts.forEach(mount => {
            mountsList.innerHTML += "<li><input type='checkbox' checked>" + mount.path + " (" + mount.name + ")</li>";
          });

          this.searchableMounts.dropbox = mounts.filter(mount => { return mount.name == "dropbox" }).map((mount) => {
            mount.find = () => {
              console.log("[Search] Dropbox-search not implemented!");
              return [];
            }
            return mount;
          });

          this.searchableMounts.github = mounts.filter(mount => { return mount.name == "github" }).map((mount) => {
            mount.find = githubSearch;
            return mount;
          });
        },
        error: function(xhr, status, error) {
          console.log("could not get list of mounts for searching: " + error);
        }
      });
  }
}
