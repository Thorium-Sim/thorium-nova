// Adapted from Endless Sky https://github.com/endless-sky/endless-sky
// Naughty words have been softened

import randomWords from "./randomWords";
import {concat, randomFromList} from "./utils";

class NameGenerator {
  words = randomWords;

  civilian1() {
    return `${randomFromList(this.words.adjectives)} ${randomFromList(
      concat(
        this.words.maleNames,
        this.words.femaleNames,
        this.words.singularNouns,
        this.words.singularNouns,
        this.words.pluralNouns,
        this.words.pluralNouns,
        this.words.nounsOfIndeteminateQuantity,
        this.words.nounsOfIndeteminateQuantity,
      ),
    )}${randomFromList(this.words.sometimesASuccessor)}`;
  }
  civilian2() {
    return `${randomFromList(
      concat(
        this.words.adjectives,
        this.words.singularNouns,
        this.words.nounsOfIndeteminateQuantity,
      ),
    )} ${randomFromList(
      concat(this.words.singularNouns, this.words.pluralNouns),
    )}`;
  }
  civilian3() {
    return `${randomFromList(
      concat(
        this.words.maleNames,
        this.words.femaleNames,
        this.words.maleNames,
        this.words.femaleNames,
        this.words.allTitles(),
      ),
    )}'s ${randomFromList(
      concat(
        this.words.singularNouns,
        this.words.pluralNouns,
        this.words.nounsOfIndeteminateQuantity,
      ),
    )}`;
  }
  civilian4() {
    return `${randomFromList(
      concat(this.words.pluralNouns, this.words.nounsOfIndeteminateQuantity),
    )} and ${randomFromList(
      concat(this.words.pluralNouns, this.words.nounsOfIndeteminateQuantity),
    )}`;
  }
  civilian5() {
    return `${randomFromList(this.words.pluralQuantities)} ${randomFromList(
      this.words.pluralNouns,
    )}`;
  }

  civilian6() {
    return `${randomFromList(
      concat(this.words.femaleNames, this.words.genderNeutralTitles),
    )} ${randomFromList(
      concat(this.words.femaleNames, this.words.thingsYouCanBeOf()),
    )}`;
  }
  civilian7() {
    return `${randomFromList(
      concat(this.words.maleNames, this.words.femaleNames),
    )} the ${randomFromList(this.words.adjectives)}`;
  }
  civilian8() {
    return `${randomFromList(
      concat(this.words.singularNouns, this.words.adjectives),
    )} ${randomFromList(this.words.allTitles())}${randomFromList(
      this.words.sometimesASuccessor,
    )}`;
  }
  civilian9() {
    return `${randomFromList(
      concat(this.words.singularNouns, this.words.pluralNouns),
    )} ${randomFromList(this.words.thingsYouCanBeOf())}`;
  }
  civilian10() {
    return `${randomFromList(
      this.words.nounsOfIndeteminateQuantity,
    )} ${randomFromList(
      concat(
        this.words.singularNouns,
        this.words.pluralNouns,
        this.words.allTitles(),
      ),
    )}`;
  }
  civilian11() {
    return `${randomFromList(
      concat(
        this.words.adjectives,
        this.words.nounsOfIndeteminateQuantity,
        this.words.singularNouns,
        this.words.allTitles(),
        this.words.femaleNames,
      ),
    )}`;
  }
  civilian12() {
    return `${randomFromList(this.words.asianPrefixes)} ${randomFromList(
      this.words.asian,
    )}${randomFromList(this.words.asianSuffixes)}`;
  }
  civilian13() {
    return `${randomFromList(this.words.prefixes)}${randomFromList(
      this.words.suffixes,
    )}`;
  }
  civilian14() {
    return randomFromList(this.words.standaloneCivilianShipNames);
  }
  civilian15() {
    return `${randomFromList(
      concat(this.words.maleTitles, this.words.genderNeutralTitles),
    )} ${randomFromList(
      concat(this.words.maleNames, this.words.thingsYouCanBeOf()),
    )}`;
  }
  civilian() {
    const num = Math.floor(Math.random() * 15) + 1;
    const key = `civilian${num}` as keyof NameGenerator;
    return this[key];
  }
  republicCapital() {
    return `R.N.S. ${randomFromList(this.words.republicCapital)}`;
  }
  republicSmall() {
    return `R.N.S. ${randomFromList(this.words.republicSmall)}`;
  }
  republicFighter() {
    return `${randomFromList(
      concat(this.words.color, this.words.greek),
    )} ${randomFromList(this.words.oneToTwelve)}`;
  }
  deep() {
    return `D.S.S. ${randomFromList(this.words.deep)}`;
  }
  deepFighter() {
    return `${randomFromList(this.words.greek)} ${randomFromList(
      this.words.oneToTwelve,
    )}`;
  }
  militia() {
    return `I.M.S. ${randomFromList(this.words.militia)}`;
  }
  freeWorldsCapital() {
    return `F.S. ${randomFromList(this.words.freeWorldsCapital)}`;
  }
  freeWorldsSmall() {
    return `F.S. ${randomFromList(this.words.freeWorldsSmall)}`;
  }
  freeWorldsFighter() {
    if (Math.random() < 0.5) {
      return `${randomFromList(this.words.phonetic)} ${randomFromList(
        this.words.digit,
      )}-${randomFromList(this.words.digit)}`;
    } else {
      return `${randomFromList(this.words.animal)} ${randomFromList(
        this.words.oneToTwelve,
      )}`;
    }
  }
  syndicateCapital() {
    return `S.S. ${randomFromList(this.words.syndicateCapital)}`;
  }
  syndicateSmall() {
    return `F-${randomFromList(this.words.digit)}${randomFromList(
      this.words.digit,
    )}${randomFromList(this.words.letter)}${randomFromList(this.words.digit)}`;
  }
  syndicateFighter() {
    return `F-${randomFromList(this.words.digit)}${randomFromList(
      this.words.digit,
    )}${randomFromList(this.words.digit)}`;
  }

  // Pirate Stuff
  pirate1() {
    return `${randomFromList(
      concat(
        this.words.pirateAdjectivesThatDontWorkAsTitles,
        this.words.pirateAdjectivesThatWorkAsTitles,
      ),
    )} ${randomFromList(
      concat(
        this.words.pirateNouns,
        this.words.badPirateNouns,
        this.words.badOutcomes,
      ),
    )}`;
  }
  pirate2() {
    return `${randomFromList(
      concat(
        this.words.pirateAdjectivesThatDontWorkAsTitles,
        this.words.pirateAdjectivesThatDontWorkBeforeSingularNouns,
        this.words.pirateAdjectivesThatWorkAsTitles,
      ),
    )} ${randomFromList(
      concat(this.words.sinisterNames, this.words.badOutcomes),
    )}`;
  }
  pirate3() {
    return `${randomFromList(this.words.sinisterNames)}'s ${randomFromList(
      concat(
        this.words.pirateNouns,
        this.words.badPirateNouns,
        this.words.badOutcomes,
      ),
    )}`;
  }
  pirate4() {
    return `${randomFromList(this.words.sinisterNames)} the ${randomFromList(
      this.words.pirateAdjectivesThatWorkAsTitles,
    )}`;
  }
  pirate5() {
    return `${randomFromList(
      concat(this.words.pirateNouns, this.words.badPirateNouns),
    )} of ${randomFromList(this.words.badOutcomes)}`;
  }
  pirate6() {
    return `${randomFromList(
      concat(
        this.words.badOutcomes,
        this.words.pirateAdjectivesThatWorkAsTitles,
        this.words.pirateAdjectivesThatDontWorkAsTitles,
      ),
    )} ${randomFromList(this.words.badPirateNouns)}`;
  }
  pirate7() {
    return randomFromList(
      concat(
        this.words.pirateNouns,
        this.words.badPirateNouns,
        this.words.badOutcomes,
      ),
    );
  }
  pirate8() {
    return `${randomFromList(this.words.piratePrefixes)}${randomFromList(
      this.words.pirateSuffixes,
    )}`;
  }
  pirate9() {
    return `${randomFromList(this.words.pirateTitles)} ${randomFromList(
      this.words.pirateHonorifics,
    )}`;
  }
  pirate() {
    const num = Math.floor(Math.random() * 9) + 1;
    const key = `pirate${num}` as keyof NameGenerator;
    return this[key];
  }
  bountyHunter1() {
    return `${randomFromList(
      this.words.bountyHunterPrefixes1,
    )} ${randomFromList(this.words.bountyHunterSuffixes1)}`;
  }
  bountyHunter2() {
    return `${randomFromList(
      this.words.bountyHunterPrefixes2,
    )} of ${randomFromList(this.words.bountyHunterSuffixes2)}`;
  }
  bountyHunter() {
    const num = Math.floor(Math.random() * 2) + 1;
    const key = `pirate${num}` as keyof NameGenerator;
    return this[key];
  }
  quarg() {
    return `${randomFromList(this.words.quargPrefixes)}${randomFromList(
      this.words.quargInterstitials,
    )}${randomFromList(this.words.quargSuffixes)}`;
  }
  pug() {
    return `${randomFromList(this.words.pugPrefixes)}${randomFromList(
      this.words.pugInterstitials,
    )}${randomFromList(this.words.pugSuffixes)}`;
  }
}

export default new NameGenerator();
