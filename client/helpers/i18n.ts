import i18next from "i18next";
import {initReactI18next} from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import codegen from "codegen.macro";
import debounce from "lodash.debounce";
i18next
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {},
    lng: "en",
    preload: ["en"],

    ns: ["translation"],
    defaultNS: "translation",
    saveMissing: true, // send not translated keys to endpoint

    nsSeparator: false,
    keySeparator: false,
    fallbackLng: false,

    interpolation: {
      escapeValue: false,
    },
  });
let localeImports: any;

codegen`
const fs = require('fs')
const path = require('path')
const locales = fs.readdirSync(path.join(__dirname,'../../locales'))
const namespaces = fs.readdirSync(path.join(__dirname,'../../locales/en'))
let localePaths = locales.reduce((prev, next) => {
  prev += "\\n\\"" + next +"\\": {"
  
  prev += namespaces.reduce((p,n) => {
    const path = "../../locales/"+next+"/"+n
    p += "\\n\\""+n.replace('.json','')+"\\": function() {return import(\\""+ path+"\\");},"
    return p;
  },"")
  prev += "\\n},"
  return prev;
},"{")
localePaths+="\\n}"
module.exports = "localeImports = " + localePaths
`;

const loadNamespace = debounce(
  function loadNamespace(lang, namespace) {
    const importFn: () => Promise<any> = localeImports[lang]?.[namespace];
    importFn()
      .then(res => {
        i18next.addResources(lang, namespace, res);
      })
      .catch(err => {
        console.error(
          `Failed to load translation resource for ${lang}: ${namespace}: ${err.message}`
        );
      });
  },
  500,
  {leading: true, trailing: false}
);

i18next.on("missingKey", function (lngs, namespace) {
  loadNamespace(lngs[0], namespace);
});
