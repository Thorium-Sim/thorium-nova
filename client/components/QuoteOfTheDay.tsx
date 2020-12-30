import {Heading} from "@chakra-ui/core";
import React, {useRef} from "react";

const quotes = [
  "Not all who wander are lost",
  "If you don’t know where your destination is, you don’t know how long you have to wander",
  "Its origin and purpose are still a total mystery...",
  "For everything, there is a first time",
  "I like to believe that there are always possibilities",
  "Sometimes a feeling is all we humans have to go on.",
  "Failure is the mark of a life well lived. In turn, the only way to live without failure is to be of no use to anyone.",
  "History has its eyes on you.",
  "We take one step at a time. In doing so we reach toward the unknown.",
  "Where does this lead us? Where do we go?",
  "If you listen carefully, the silence is beautiful.",
  "The man who has no imagination has no wings.",
  "Life before death. Strength before weakness. Journey before destination.",
  "We are the ones we have been waiting for.",
  "While you live, shine; have no grief at all. Life exists only for a short while and Time demands his due.",
  "I am burdened with glorious purpose.",
  "The hardest choices require the strongest wills.",
  "Like a snowflake in a blizzard...",
  "Fun isn’t something one considers when balancing the universe. But this… does put a smile on my face.",
  "The work is done, as it always will be. I am inevitable.",
  "It's better to look good than to feel good.",
  "Some of us have to work for a living!",
  "Educating minds with the discipline of wonder.",
  "While others sleep, you dream.",
  "Time is an illusion. Lunchtime doubly so.",
  "I may not have gone where I intended to go, but I think I have ended up where I needed to be.",
  // Douglas Adams
  "Don't Panic.",
  "I'd far rather be happy than right any day.",
  "For a moment, nothing happened. Then, after a second or so, nothing continued to happen.",
  "Reality is frequently inaccurate.",
  "It is a mistake to think you can solve any major problems just with potatoes.",
  // AI Generated Ship Names
  "Dangerous But Not Unbearably So",
  "So much for subtlety",
  "Just as likely to still be an intergalactic jellyfish.",
  "And the world will fall with ignorance...",
  "You don't know I'm not crazy.",
  "If you cannot do great things, do small things in a great way.",
  "This is the way. I have spoken.",
  "Suffering exists. It has a cause. It has an end. And there is a noble path to ending it.",
  "We are what they grow beyond. That is the true burden of all masters.",
  "We grow small trying to be great.",
  "The whole point of getting things done is knowing what to leave undone.",
  "The days are long, but the years are short.",
  "I preferred to be called Nobody.",
  "He who least needs tomorrow, will most gladly greet tomorrow",
  /* Banksy */
  "They say you die twice; Once when you stop breathing and again when someone says your name for the last time.",
  "There's nothing more dangerous than someone who wants to make the world a better place.",
  "There are three kinds of people in this world: those who like you, those who hate you, and those who don't care about you.",
  "I need someone to protect me from all the measures they take in order to protect me.",
  "If you get tired, learn to rest, not to quit.",
  "Be positive, patient and persistent.",
  "This revolution is for display purposes only.",
  /* Back to regularly scheduled programming */
  "Nobody knows what their story is until the end.",
  "Love isn't a triangle. It's a five dimensional blob.",
  "This spaceship doesn't come with an insurance plan.",
  "There is some good news. There’s some cake left!",
  "In case you were wondering, I am, by definition, the best version of myself.",
  "I'm not crazy, I'm just colorful.",
  "What we do in life, echoes in eternity.",
  "Institutions have a future … but people have no future. People have only hope.",
  // Klingon Proverbs
  "Destroying an empire to win a war is no victory. And ending a battle to save an empire is no defeat.",
  "Great people do not seek power; they have power thrust upon them.",
  "I am not afraid. I will not hide my face behind stone and mortar. I will stand before the wind and make it respect me.",
  "What are the tools you use to create memories?",
  // Buffy
  "The one and only, the original, accept-no-substitute.",
  "The monkey's the only cookie animal that gets to wear clothes. You know that?",
  'Like is the hippo goin\', "Hey man. Where are my pants? I have my hippo dignity."',
  'The monkey\'s just, "I mock you with my monkey pants!"',
  "And then there's a big coup in the zoo.",
  "Man can't turn his back on what he came from. Besides, black is slimming.",
  // The Good Place
  "It's not a joke; I'm a legit snack!",
  // Natalie
  "Words are the threads that weave the tapestries of life.",
  "Salutations of the seasons be upon you.",
  "Little victories, my friends. Little victories.",
  "It is what we can’t see that fuels our imagination.",
  "This is Art holding a Mirror up to Life. That’s why everything is exactly the wrong way around.",
  "Listen to the quiet.",
  "Don't try to be a great man, just be a man. And let history make its own judgments.",
  // Horrible Goose
  "Your garden? I make it terrible! I make a puzzle of your garden!",
  "Here I come again!",
  "You cannot anticipate me because your brain is so big and weighty and far from the ground, but my brain is aerodynamic and small and ground-sure and I have all I need in my wicked goose-body, and also I have your radio.",
  "I put my honk in a jar so there is more honk!",
  // AI Generated Spaceship Names
  "Still Wrong, After All These Years",
  "I'll just be over here",
  "I do the best I can",
  "Would you like to know more?",
  "I did it for Science!",
  "Can't Win 'Em All",
  "Extreme Problems call for Extreme Solutions",
  "An attempt at perspective",
  "This is my time, and I control it.",
  "All theory, dear friend, is grey, but the golden tree of life springs ever green.",
  // Ubuntu
  "I am what I am because of who we all are",
  "What shall I build or write against the fall of night?",
  // Catch-22
  "There was no telling what people might find out if they felt free to ask whatever questions they wanted to.",
  "Just because you're paranoid doesn't mean they aren't after you.",
  "He knew everything there was to know about literature, except how to enjoy it.",
  "Insanity is contagious.",
  "Brains are weird, man. Weird, and grey, and squishy.",
  "You are entitled to your own opinion, but you are not entitled to your own facts.",
  "It is not incumbent on you to complete the task, but neither are you free to desist from it.",
  "May you live in interesting times.",
  // Will Durant
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
];

const QuoteOfTheDay = () => {
  const quote = useRef(quotes[Math.floor(Math.random() * quotes.length)]);
  return (
    <Heading
      size="lg"
      fontWeight={400}
      px={2}
      mt={2}
      position="absolute"
      bottom="0"
      right="0"
      color="whiteAlpha.600"
    >
      <small>{quote.current}</small>
    </Heading>
  );
};

export default QuoteOfTheDay;
