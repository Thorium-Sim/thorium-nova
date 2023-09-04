import {useRef} from "react";

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
  "I may not have gone where I intended to go, but I think I have ended up where I needed to be.",
  // Douglas Adams
  "Don't Panic.",
  "Time is an illusion. Lunchtime doubly so.",
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
  "He who least needs tomorrow, will most gladly greet tomorrow.",
  /* Banksy */
  "They say you die twice; Once when you stop breathing and again when someone says your name for the last time.",
  "There's nothing more dangerous than someone who wants to make the world a better place.",
  "There are three kinds of people in this world: those who like you, those who hate you, and those who don't care about you.",
  "I need someone to protect me from all the measures they take in order to protect me.",
  "If you get tired, learn to rest, not to quit.",
  "Be positive, patient, and persistent.",
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
  "Still Wrong, After All These Years.",
  "I'll just be over here.",
  "I do the best I can.",
  "Would you like to know more?",
  "I did it for Science!",
  "Can't Win 'Em All.",
  "Extreme Problems call for Extreme Solutions.",
  "An attempt at perspective.",
  "This is my time, and I control it.",
  "All theory, dear friend, is grey, but the golden tree of life springs ever green.",
  // Ubuntu
  "I am what I am because of who we all are.",
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
  // Ms Frizzle
  "Take chances, make mistakes, and get messy.",
  "The best way to know is to do.",
  "Looks can be deceiving. Oftentimes what is isn’t, and what isn’t is.",
  "If you keep asking questions, you’ll keep getting answers.",
  "If you don’t look, you’ll never see. And what you don’t see can be very hard to find.",
  "Where the road ends, adventure begins!",
  // Soren Kierkegaard
  "Life can only be understood backwards; but it must be lived forwards.",
  // Swyx
  "Small minds discuss tactics, average minds discuss strategy, great minds discuss destiny",
  // Something about yeast not feeling pain?
  "Ow! My very being!",
  // Soren, ST:Generations
  "They say time is the fire in which we burn.",
  "Fragile. Not like flowers. Like bombs.",
  // MLK
  "A time comes when silence is betrayal.",
  // The Fall of Kang
  "So honor the valiant who die 'neath your sword, But pity the warrior who slays all his foes.",
  // Dragonforce
  "On towards the wilderness, our quest carries on.",
  "Far beyond the sundown, far beyond the moonlight, deep inside our hearts and all our souls",
  // Chinese Maxim
  "Of all the thirty-six stratagems, to know when to quit is the best.",
  // Exhalation
  "I am not that air; I am the pattern that it assumed, temporarily.",
  // Random book quotes
  "You want to fight a god? You’d better have one on your side too.",
  "All we have to decide is what to do with the time that is given us.",
  "The truth is, once you learn how to die, you learn how to live.",
  "It is only with the heart that one can see rightly; what is essential is invisible to the eye.",
  "I'm not much, but I'm all I have.",
  "Sometimes I can hear my bones straining under the weight of all the lives I'm not living.",
  "We have big plans. Oh yes. We're fumbling in the dark, but at least we're in motion.",
  "Sad things are beautiful in a way which can only be explained to those who already understand.",
  "My life amounts to no more than one drop in a limitless ocean. Yet what is any ocean, but a multitude of drops?",
  "Time moves slowly, but passes quickly.",
  "What a treacherous thing to believe that a person is more than a person.",
  "All human wisdom is in these two words: Wait and Hope!",
  "The mystery of life isn't a problem to solve, but a reality to experience.",
  "Fear is the mind killer.",
  "Down to earth, but looking at the stars.",
  "I don't want deep pockets; I want conversation.",
  "What's the worth of a grand if you waste a thousand years?",
  "The man whistling tunes pianos.",
  // Rules of Acquisition
  "Opportunity plus instinct equals profit.",
  "You can't buy fate.",
  "More is good... all is better.",
  "The riskier the road, the greater the profit.",
  "Sometimes the only thing more dangerous than a question is an answer.",
  "Free advice is seldom cheap.",
  // Chaucer
  "See yonder, lo, the Galaxy which men calleth the Milky Way, for it is white.",
  // Dickens
  "The Sun himself is weak when he first rises, and gathers strength and courage as the day gets on.",
  // The Rainbow Connection
  "What's so amazing that keeps us star gazing? And what do we think we might see?",
  "We know that it's probably magic.",
  "Have you been half asleep and have you heard voices? I've heard them calling my name.",
  "I've heard it too many times to ignore it. It's something that I'm supposed to be.",
  // Mark Twain quotes
  "History doesn't repeat itself, but it does rhyme.",
  "The two most important days in your life are the day you are born and the day you find out why.",
  "Whenever you find yourself on the side of the majority, it is time to pause and reflect.",
  "Truth is stranger than fiction, but it is because Fiction is obliged to stick to possibilities; Truth isn't.",
  // Poe
  "All that we see or seem is but a dream within a dream.",
  // Kirk in space
  "I hope I never recover from this.",
  // Ike
  "Plans are useless, but planning is indispensable.",
  // Alex
  "I feel like we're drowning in ambition.",
  // Gilmore
  "It Takes A Remarkable Person To Inspire All Of This.",
  "That Was A Once In A Lifetime Experience - Only If You Want It To Be.",
  "We're Almost There, But Nowhere Near It. All That Matters Is That We're Going.",
  // Cereal Box
  "Feel good about breakfast. Feel good about every day!",
  // Andre Gide
  "Man cannot discover new oceans unless he has the courage to lose sight of the shore.",
  // Teller
  "Sometimes magic is just someone spending more time on something than anyone else might reasonably expect.",
  "Intelligence and infallibility are mutually exclusive.",
  // Ernst Kirchsteiger
  "In the simple lives the beautiful.",
  // Steve Jobs
  "The most powerful person in the world is the storyteller.",
  // Hey Now
  "Imagination calling mirrors for you.",
  // Albert Einstein
  "The only reason for time is so that everything doesn't happen at once.",
  "Reality is merely an illusion, albeit a very persistent one.",
  "The true sign of intelligence is not knowledge but imagination.",
  // Whimsey
  "Perfect. That is to say, slightly flawed. The mark of a true gentleman.",
  // Zodiac
  "Always under the same sky.",
  // 🤷
  "I was just dreaming a little for you because all my dreams are gone.",
  "Danger is very real, but fear is a choice.",
  "Individual moments of brilliance in concert",
  "Nobody gets to go back, only forward",
  "When I leave, you will finally understand why storms are named after people.",
  "We are autumn children, burdened with memories of sun.",
  "Impudent of you to assume I will meet a mortal end.",
  "Heaven, are you watching?",
  // The lost metal
  "You're the wind. You're the stars. You are all endless things.",
  // Larry Elison
  "Choose your competitors carefully, because you'll become a lot like them.",
  // William Martin
  "Make the ordinary come alive. The extraordinary will take care of itself.",
  // Trashy Quotes
  "Of all the senses, sight must be the most delightful.",
  // Brene Brown
  "No one belongs here more than you.",
  "When we own the story, we can write a brave new ending.",
  // Timothy Dexter
  "I am the first in the east. I am the first in the west. I am the first of all things.",
  // Václav Havel
  "Hope is not the conviction that something will turn out well, but the certainty that something is worth doing no matter how it turns out.",
  // Pierre Coubertin
  "The important thing in life is not the triumph, but the struggle.",
  // Sarah Williams
  "Though my soul may set in darkness, it will rise in perfect light; I have loved the stars too fondly to be fearful of the night.",
  // Ozymandias
  "Look on my works, ye Mighty, and despair!",
  // Muppets
  "Life's like a movie, write your own ending, keep believing, keep pretending.",
  "There's not a word yet for old friends who've just met.",
  "Life is made up of meetings and partings and that is the way of it.",
  // Chantastic
  "It's only dark until your eyes adjust.",
  // Arthur C Clarke
  "The only way of discovering the limits of the possible is to venture a little way past them into the impossible.",
  "Leading others to a promised land that you yourself will never set foot in.",
  "Your heart knows the direction. Run!",
  // Wolfgang Pauli
  "That is not only not right; it is not even wrong!",
  // Natalie's Bishop's Wife. Also maybe Draconius
  "I'm tired of being a wanderer. I'm tired of an existence where one is neither hot nor cold, hungry nor full.",
  // The Little Prince
  "If you want to build a ship, don't drum up the people to gather wood, divide the work, and give orders. Instead, teach them to yearn for the vast and endless sea.",
  "Dream big, and you may never wake up.",
  // Drake. From https://collabfund.com/blog/thoughts/
  "People like you more when you are working towards something, not when you have it.",
  // https://twitter.com/shminsington/status/1670799279974232064
  "As you howl your melancholy question into the abyss, tell me - which do you dread more? the echo, or the answer?",
  // Kilton
  "Look and learn! Then you won’t hate! Understand what you fear and you’ll feel great! For those with an open mind, wonders always await!",
  // Paul Samuelson
  "Well when events change, I change my mind. What do you do?",
  // https://twitter.com/visakanv/status/1443196536800772115
  "So we beat on, boats against the current, saying ayy lmao.",
  // Walt Whitman. Also, Ted Lasso
  "Be curious, not judgemental.",
  "You alone are not enough, but you can still do great things.",
  // Jeremy Goldberg
  "Courage is knowing it might hurt, and doing it anyway. Stupidity is the same. And that's why life is hard.",
  // Marvin Minsky
  "If you understand something in only one way, then you don't really understand it at all.",
  // I can eat a glass; it doesn't hurt me.
  "Vitrum edere possum; mihi non nocet.",
  // https://twitter.com/cassidoo/status/1696672212491608144
  "Is the juice worth the squeeze?",
  // PartyKit
  "Everything is better with friends.",
  // https://twitter.com/bookpoets/status/1697615168711381090
  "I'll never know, and neither will you of the life you don't choose.",
  // Hiromu Arakawa
  "It's a cruel and random world, but the chaos is all so beautiful.",
  "Basking in reflected glory.",
];

const QuoteOfTheDay = () => {
  const quote = useRef(quotes[Math.floor(Math.random() * quotes.length)]);
  return (
    <h5 className="text-lg px-2 fixed bottom-0 right-0 text-white text-opacity-60 max-w-prose">
      {quote.current}
    </h5>
  );
};

export default QuoteOfTheDay;
