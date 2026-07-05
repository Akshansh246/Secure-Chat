import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys & Emotion',
    icon: '😊',
    emojis: [
      { char: '😀', name: 'grinning face', tags: 'grinning,face,happy,smile,grin' },
      { char: '😃', name: 'smiley face', tags: 'smiley,face,happy,smile,grin,big eyes' },
      { char: '😄', name: 'laughing face', tags: 'laughing,face,happy,smile,grin' },
      { char: '😁', name: 'beaming face', tags: 'beaming,face,happy,smile,grin,teeth' },
      { char: '😆', name: 'squinting laughing face', tags: 'squinting,laughing,face,happy,smile,grin,haha' },
      { char: '😅', name: 'grinning face with sweat', tags: 'grinning,face,sweat,happy,smile,relief,whew' },
      { char: '😂', name: 'face with tears of joy', tags: 'tears,joy,face,laugh,haha,crying' },
      { char: '🤣', name: 'rolling on the floor laughing', tags: 'rolling,floor,laughing,face,rofl,haha' },
      { char: '😊', name: 'smiling face', tags: 'smiling,face,happy,smile,blush' },
      { char: '😇', name: 'smiling face with halo', tags: 'smiling,face,halo,angel,innocent' },
      { char: '🙂', name: 'slightly smiling face', tags: 'slightly,smiling,face,smile' },
      { char: '🙃', name: 'upside-down face', tags: 'upside-down,face,silly,sarcastic' },
      { char: '😉', name: 'winking face', tags: 'winking,face,wink,smile' },
      { char: '😌', name: 'relieved face', tags: 'relieved,face,relief,calm,peaceful' },
      { char: '😍', name: 'heart eyes face', tags: 'heart eyes,face,love,heart,adore' },
      { char: '🥰', name: 'smiling face with hearts', tags: 'smiling,hearts,face,love,affection' },
      { char: '😘', name: 'face blowing a kiss', tags: 'kiss,face,love,affection,muah' },
      { char: '😋', name: 'face savoring food', tags: 'savoring,food,face,delicious,yum,hungry' },
      { char: '😛', name: 'face with tongue', tags: 'tongue,face,silly' },
      { char: '😜', name: 'winking face with tongue', tags: 'winking,tongue,face,silly,wink,playful' },
      { char: '🤪', name: 'zany face', tags: 'zany,face,silly,crazy,goofy' },
      { char: '😎', name: 'smiling face with sunglasses', tags: 'sunglasses,face,cool,chill,confident' },
      { char: '🧐', name: 'face with monocle', tags: 'monocle,face,smart,think,curious' },
      { char: '🤓', name: 'nerd face', tags: 'nerd,face,smart,geek,study' },
      { char: '😏', name: 'smirking face', tags: 'smirking,face,smirk,sly,flirt' },
      { char: '😒', name: 'unamused face', tags: 'unamused,face,bored,meh,sigh' },
      { char: '😔', name: 'pensive face', tags: 'pensive,face,sad,depressed,sorrow' },
      { char: '😟', name: 'worried face', tags: 'worried,face,sad,anxious' },
      { char: '😕', name: 'confused face', tags: 'confused,face,unsure,huh' },
      { char: '🙁', name: 'slightly frowning face', tags: 'slightly,frowning,face,sad' },
      { char: '☹️', name: 'frowning face', tags: 'frowning,face,sad' },
      { char: '🥺', name: 'pleading face', tags: 'pleading,face,sad,puppy eyes,begging' },
      { char: '😢', name: 'crying face', tags: 'crying,face,sad,tear' },
      { char: '😭', name: 'loudly crying face', tags: 'loudly,crying,face,sad,sob,tear,bawling' },
      { char: '😤', name: 'face with steam from nose', tags: 'steam,nose,face,angry,mad,triumph' },
      { char: '😠', name: 'angry face', tags: 'angry,face,mad,annoyed' },
      { char: '😡', name: 'pouting face', tags: 'pouting,face,angry,mad,rage' },
      { char: '🤬', name: 'face with symbols on mouth', tags: 'symbols,mouth,face,swear,cursing,angry' },
      { char: '🤯', name: 'exploding head', tags: 'exploding,head,mind blown,shocked' },
      { char: '😳', name: 'flushed face', tags: 'flushed,face,blush,embarrassed,shocked' },
      { char: '🥵', name: 'hot face', tags: 'hot,face,heat,sweat,summer' },
      { char: '🥶', name: 'cold face', tags: 'cold,face,freeze,winter,blue' },
      { char: '😱', name: 'face screaming in fear', tags: 'screaming,fear,face,scared,shocked' },
      { char: '😨', name: 'fearful face', tags: 'fearful,face,scared,shocked' },
      { char: '😰', name: 'anxious face with sweat', tags: 'anxious,sweat,face,scared,worried' },
      { char: '😥', name: 'sad but relieved face', tags: 'sad,relieved,face,sweat,relief' },
      { char: '😓', name: 'downcast face with sweat', tags: 'downcast,sweat,face,sad,stressed' },
      { char: '🤔', name: 'thinking face', tags: 'thinking,face,ponder,question' },
      { char: '🤫', name: 'shushing face', tags: 'shushing,face,quiet,secret,hush' },
      { char: '😶', name: 'face without mouth', tags: 'no mouth,face,quiet,silent' },
      { char: '😐', name: 'neutral face', tags: 'neutral,face,meh,bored,okay' },
      { char: '😑', name: 'expressionless face', tags: 'expressionless,face,meh,flat' },
      { char: '😬', name: 'grimacing face', tags: 'grimacing,face,awkward,nervous' },
      { char: '🫠', name: 'melting face', tags: 'melting,face,hot,sarcastic,exhausted' },
      { char: '🙄', name: 'face with rolling eyes', tags: 'rolling eyes,face,annoyed,meh,whatever' },
      { char: '🥱', name: 'yawning face', tags: 'yawning,face,tired,sleepy,bored' },
      { char: '😴', name: 'sleeping face', tags: 'sleeping,face,sleep,tired,zzz' },
      { char: '🤤', name: 'drooling face', tags: 'drooling,face,hungry,sleepy' },
      { char: '😵', name: 'dizzy face', tags: 'dizzy,face,shocked,dead' },
      { char: '🤐', name: 'zipper-mouth face', tags: 'zipper-mouth,face,secret,zipped' },
      { char: '🥴', name: 'woozy face', tags: 'woozy,face,drunk,dizzy,weird' },
      { char: '🤢', name: 'nauseated face', tags: 'nauseated,face,sick,gross,green' },
      { char: '🤮', name: 'face vomiting', tags: 'vomiting,face,sick,throw up' },
      { char: '🤠', name: 'cowboy hat face', tags: 'cowboy,hat,face,yeehaw' },
      { char: '🤡', name: 'clown face', tags: 'clown,face,silly,joker' },
      { char: '🥳', name: 'partying face', tags: 'partying,face,celebrate,party,birthday' },
      { char: '😈', name: 'smiling face with horns', tags: 'horns,face,devil,evil,mischievous' },
      { char: '👿', name: 'angry face with horns', tags: 'horns,face,devil,angry,evil' },
      { char: '💀', name: 'skull', tags: 'skull,dead,skeleton,lol,death' },
      { char: '👻', name: 'ghost', tags: 'ghost,spooky,halloween,scary' },
      { char: '👽', name: 'alien', tags: 'alien,ufo,space,weird' },
      { char: '👾', name: 'alien monster', tags: 'alien,monster,game,retro,space' },
      { char: '💩', name: 'pile of poo', tags: 'poo,poop,shit,silly' }
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures & Body',
    icon: '👋',
    emojis: [
      { char: '👋', name: 'waving hand', tags: 'waving,hand,hello,bye,hi' },
      { char: '🤚', name: 'raised back of hand', tags: 'raised,back,hand' },
      { char: '🖐️', name: 'hand with fingers splayed', tags: 'fingers splayed,hand,five' },
      { char: '✋', name: 'raised hand', tags: 'raised,hand,stop,five' },
      { char: '🖖', name: 'vulcan salute', tags: 'vulcan,salute,spock,star trek' },
      { char: '👌', name: 'ok hand', tags: 'ok,hand,perfect,good' },
      { char: '🤌', name: 'pinched fingers', tags: 'pinched,fingers,italian,what' },
      { char: '🤏', name: 'pinching hand', tags: 'pinching,hand,small,little' },
      { char: '✌️', name: 'victory hand', tags: 'victory,hand,peace,two' },
      { char: '🤞', name: 'crossed fingers', tags: 'crossed,fingers,luck,hope' },
      { char: '🤟', name: 'love-you gesture', tags: 'love,gesture,hand,ily' },
      { char: '🤘', name: 'sign of the horns', tags: 'horns,hand,rock,metal' },
      { char: '🤙', name: 'call me hand', tags: 'call me,hand,phone,shaka' },
      { char: '👈', name: 'backhand index pointing left', tags: 'pointing left,hand,index' },
      { char: '👉', name: 'backhand index pointing right', tags: 'pointing right,hand,index' },
      { char: '👆', name: 'backhand index pointing up', tags: 'pointing up,hand,index' },
      { char: '🖕', name: 'middle finger', tags: 'middle finger,hand,rude' },
      { char: '👇', name: 'backhand index pointing down', tags: 'pointing down,hand,index' },
      { char: '👍', name: 'thumbs up', tags: 'thumbs up,hand,agree,good,yes,like' },
      { char: '👎', name: 'thumbs down', tags: 'thumbs down,hand,disagree,bad,no,dislike' },
      { char: '✊', name: 'raised fist', tags: 'raised,fist,power' },
      { char: '👊', name: 'oncoming fist', tags: 'oncoming,fist,punch,brofist' },
      { char: '🤛', name: 'left-facing fist', tags: 'left,fist,punch' },
      { char: '🤜', name: 'right-facing fist', tags: 'right,fist,punch' },
      { char: '👏', name: 'clapping hands', tags: 'clapping,hands,applause,bravo' },
      { char: '🙌', name: 'raising hands', tags: 'raising,hands,celebration,hooray' },
      { char: '👐', name: 'open hands', tags: 'open,hands,hug' },
      { char: '🤲', name: 'palms up together', tags: 'palms,together,pray,book' },
      { char: '🤝', name: 'handshake', tags: 'handshake,deal,agreement,meet' },
      { char: '🙏', name: 'folded hands', tags: 'folded,hands,pray,please,thanks,thank you' },
      { char: '✍️', name: 'writing hand', tags: 'writing,hand,pen,write' },
      { char: '💅', name: 'nail polish', tags: 'nail,polish,beauty,sass,care' },
      { char: '🤳', name: 'selfie', tags: 'selfie,phone,camera,arm' },
      { char: '💪', name: 'flexed biceps', tags: 'flexed,biceps,muscle,strong,power,workout' },
      { char: '🧠', name: 'brain', tags: 'brain,mind,smart,think' },
      { char: '👀', name: 'eyes', tags: 'eyes,look,see,watch' },
      { char: '👁️', name: 'eye', tags: 'eye,look,see' },
      { char: '👅', name: 'tongue', tags: 'tongue,lick,mouth' },
      { char: '👄', name: 'mouth', tags: 'mouth,lips,kiss' },
      { char: '💋', name: 'kiss mark', tags: 'kiss mark,lips,love,romance' },
      { char: '🩸', name: 'drop of blood', tags: 'drop,blood,sick,bleed' },
      { char: '👤', name: 'bust in silhouette', tags: 'bust,silhouette,user,profile,person' },
      { char: '👥', name: 'busts in silhouette', tags: 'busts,silhouette,users,group,people' }
    ]
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: '🐱',
    emojis: [
      { char: '🐶', name: 'dog face', tags: 'dog,face,puppy,pet,animal' },
      { char: '🐱', name: 'cat face', tags: 'cat,face,kitten,pet,animal' },
      { char: '🐭', name: 'mouse face', tags: 'mouse,face,animal,rodent' },
      { char: '🐹', name: 'hamster face', tags: 'hamster,face,pet,animal' },
      { char: '🐰', name: 'rabbit face', tags: 'rabbit,face,bunny,pet,animal' },
      { char: '🦊', name: 'fox face', tags: 'fox,face,animal,clever' },
      { char: '🐻', name: 'bear face', tags: 'bear,face,animal,teddy' },
      { char: '🐼', name: 'panda face', tags: 'panda,face,animal,china' },
      { char: '🐨', name: 'koala', tags: 'koala,animal,australia' },
      { char: '🐯', name: 'tiger face', tags: 'tiger,face,animal,wild' },
      { char: '🦁', name: 'lion face', tags: 'lion,face,animal,wild,king' },
      { char: '🐮', name: 'cow face', tags: 'cow,face,animal,farm' },
      { char: '🐷', name: 'pig face', tags: 'pig,face,animal,farm' },
      { char: '🐸', name: 'frog face', tags: 'frog,face,animal,amphibian' },
      { char: '🐵', name: 'monkey face', tags: 'monkey,face,animal' },
      { char: '🐔', name: 'chicken', tags: 'chicken,animal,farm,bird' },
      { char: '🐧', name: 'penguin', tags: 'penguin,animal,bird,ice' },
      { char: '🐦', name: 'bird', tags: 'bird,animal,fly' },
      { char: '🦆', name: 'duck', tags: 'duck,bird,animal' },
      { char: '🦅', name: 'eagle', tags: 'eagle,bird,animal,wild' },
      { char: '🦉', name: 'owl', tags: 'owl,bird,animal,wise' },
      { char: '🐝', name: 'honeybee', tags: 'honeybee,bee,insect,bug,honey' },
      { char: '🐛', name: 'bug', tags: 'bug,insect,caterpillar' },
      { char: '🦋', name: 'butterfly', tags: 'butterfly,insect,pretty' },
      { char: '🐌', name: 'snail', tags: 'snail,insect,slow' },
      { char: '🐞', name: 'lady beetle', tags: 'lady beetle,ladybug,bug' },
      { char: '🐜', name: 'ant', tags: 'ant,bug,insect' },
      { char: '🕷️', name: 'spider', tags: 'spider,bug,spooky' },
      { char: '🐢', name: 'turtle', tags: 'turtle,animal,slow' },
      { char: '🐍', name: 'snake', tags: 'snake,animal,reptile' },
      { char: '🦎', name: 'lizard', tags: 'lizard,animal,reptile' },
      { char: '🐙', name: 'octopus', tags: 'octopus,animal,sea' },
      { char: '🦑', name: 'squid', tags: 'squid,animal,sea' },
      { char: '🦀', name: 'crab', tags: 'crab,animal,sea,cancer' },
      { char: '🐡', name: 'blowfish', tags: 'blowfish,animal,sea' },
      { char: '🐠', name: 'tropical fish', tags: 'tropical,fish,sea,animal' },
      { char: '🐟', name: 'fish', tags: 'fish,sea,animal' },
      { char: '🐬', name: 'dolphin', tags: 'dolphin,sea,animal' },
      { char: '🐳', name: 'spouting whale', tags: 'spouting,whale,sea,animal' },
      { char: '🦈', name: 'shark', tags: 'shark,sea,animal,wild' },
      { char: '🐊', name: 'crocodile', tags: 'crocodile,animal,reptile' },
      { char: '🐅', name: 'tiger', tags: 'tiger,animal,wild' },
      { char: '🐆', name: 'leopard', tags: 'leopard,animal,wild' },
      { char: '🦓', name: 'zebra', tags: 'zebra,animal,wild' },
      { char: '🦍', name: 'gorilla', tags: 'gorilla,animal,wild' },
      { char: '🐘', name: 'elephant', tags: 'elephant,animal,wild' },
      { char: '🦛', name: 'hippopotamus', tags: 'hippopotamus,hippo,animal' },
      { char: '🐪', name: 'camel', tags: 'camel,desert,animal' },
      { char: '🦒', name: 'giraffe', tags: 'giraffe,animal' },
      { char: '🦘', name: 'kangaroo', tags: 'kangaroo,australia,animal' },
      { char: '🐎', name: 'horse', tags: 'horse,animal,race' },
      { char: '🐖', name: 'pig', tags: 'pig,animal,farm' },
      { char: '🐏', name: 'ram', tags: 'ram,sheep,animal' },
      { char: '🐑', name: 'ewe', tags: 'ewe,sheep,animal,fluffy' },
      { char: '🐐', name: 'goat', tags: 'goat,animal,farm' },
      { char: '🐕', name: 'dog', tags: 'dog,pet,animal' },
      { char: '🐈', name: 'cat', tags: 'cat,pet,animal' },
      { char: '🐓', name: 'rooster', tags: 'rooster,bird,farm' },
      { char: '🦚', name: 'peacock', tags: 'peacock,bird,pretty' },
      { char: '🕊️', name: 'dove', tags: 'dove,bird,peace' },
      { char: '🐇', name: 'rabbit', tags: 'rabbit,bunny,pet' },
      { char: '🐉', name: 'dragon', tags: 'dragon,mythical,cool' },
      { char: '🌵', name: 'cactus', tags: 'cactus,desert,plant' },
      { char: '🎄', name: 'christmas tree', tags: 'christmas tree,holiday,pine' },
      { char: '🌲', name: 'evergreen tree', tags: 'evergreen,tree,pine,forest' },
      { char: '🌳', name: 'deciduous tree', tags: 'deciduous,tree,forest,nature' },
      { char: '🌴', name: 'palm tree', tags: 'palm,tree,beach,island' },
      { char: '🌱', name: 'seedling', tags: 'seedling,plant,grow,spring' },
      { char: '🌿', name: 'herb', tags: 'herb,plant,leaf' },
      { char: '🍀', name: 'four leaf clover', tags: 'four leaf clover,luck,green' },
      { char: '🍁', name: 'maple leaf', tags: 'maple,leaf,autumn,canada' },
      { char: '🍂', name: 'fallen leaf', tags: 'fallen,leaf,autumn' },
      { char: '🍃', name: 'leaf fluttering in wind', tags: 'leaf,wind,flutter' },
      { char: '🍄', name: 'mushroom', tags: 'mushroom,fungus,nature' },
      { char: '🐚', name: 'spiral shell', tags: 'spiral,shell,beach,sea' },
      { char: '🪨', name: 'rock', tags: 'rock,stone' },
      { char: '🌙', name: 'crescent moon', tags: 'crescent,moon,night,space' },
      { char: '☀️', name: 'sun', tags: 'sun,sunny,hot,day' },
      { char: '⛅', name: 'sun behind cloud', tags: 'sun,cloud,weather,cloudy' },
      { char: '☁️', name: 'cloud', tags: 'cloud,weather,sky' },
      { char: '⛈️', name: 'cloud with lightning and rain', tags: 'cloud,lightning,rain,storm,weather' },
      { char: '❄️', name: 'snowflake', tags: 'snowflake,snow,cold,winter' },
      { char: '🔥', name: 'fire', tags: 'fire,hot,burn,lit,cool' },
      { char: '💧', name: 'droplet', tags: 'droplet,water,rain,wet' },
      { char: '🌊', name: 'water wave', tags: 'water,wave,sea,ocean,beach' }
    ]
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: '🍎',
    emojis: [
      { char: '🍏', name: 'green apple', tags: 'green apple,fruit,healthy' },
      { char: '🍎', name: 'red apple', tags: 'red apple,fruit,healthy' },
      { char: '🍐', name: 'pear', tags: 'pear,fruit' },
      { char: '🍊', name: 'tangerine', tags: 'tangerine,orange,fruit' },
      { char: '🍋', name: 'lemon', tags: 'lemon,sour,fruit' },
      { char: '🍌', name: 'banana', tags: 'banana,fruit,yellow' },
      { char: '🍉', name: 'watermelon', tags: 'watermelon,fruit,summer' },
      { char: '🍇', name: 'grapes', tags: 'grapes,fruit,wine' },
      { char: '🍓', name: 'strawberry', tags: 'strawberry,fruit,sweet' },
      { char: '🫐', name: 'blueberries', tags: 'blueberries,fruit,berry' },
      { char: '🍒', name: 'cherries', tags: 'cherries,fruit,sweet' },
      { char: '🍑', name: 'peach', tags: 'peach,fruit' },
      { char: '🍍', name: 'pineapple', tags: 'pineapple,fruit,tropical' },
      { char: '🥥', name: 'coconut', tags: 'coconut,fruit,tropical' },
      { char: '🥝', name: 'kiwi fruit', tags: 'kiwi,fruit' },
      { char: '🍅', name: 'tomato', tags: 'tomato,vegetable,red' },
      { char: '🍆', name: 'eggplant', tags: 'eggplant,vegetable,purple' },
      { char: '🥑', name: 'avocado', tags: 'avocado,fruit,healthy' },
      { char: '🥦', name: 'broccoli', tags: 'broccoli,vegetable,green' },
      { char: '🌽', name: 'ear of corn', tags: 'corn,popcorn,farm' },
      { char: '🥕', name: 'carrot', tags: 'carrot,vegetable,orange' },
      { char: '🧅', name: 'onion', tags: 'onion,vegetable' },
      { char: '🥔', name: 'potato', tags: 'potato,starch' },
      { char: '🍞', name: 'bread', tags: 'bread,toast,bakery' },
      { char: '🥐', name: 'croissant', tags: 'croissant,bread,french' },
      { char: '🥖', name: 'baguette bread', tags: 'baguette,bread,french' },
      { char: '🧀', name: 'cheese wedge', tags: 'cheese,yellow,delicious' },
      { char: '🥚', name: 'egg', tags: 'egg,breakfast' },
      { char: '🍳', name: 'cooking', tags: 'cooking,egg,fry,pan,breakfast' },
      { char: '🥞', name: 'pancakes', tags: 'pancakes,breakfast,sweet' },
      { char: '🥓', name: 'bacon', tags: 'bacon,breakfast,meat' },
      { char: '🥩', name: 'cut of meat', tags: 'meat,steak,beef' },
      { char: '🍗', name: 'poultry leg', tags: 'poultry leg,chicken,drumstick,meat' },
      { char: '🍔', name: 'hamburger', tags: 'hamburger,burger,fast food,cheese' },
      { char: '🍟', name: 'french fries', tags: 'french fries,fries,fast food' },
      { char: '🍕', name: 'pizza', tags: 'pizza,slice,cheese,fast food' },
      { char: '🥪', name: 'sandwich', tags: 'sandwich,lunch' },
      { char: '🌮', name: 'taco', tags: 'taco,mexican,fast food' },
      { char: '🌯', name: 'burrito', tags: 'burrito,mexican,fast food' },
      { char: '🥗', name: 'green salad', tags: 'green salad,healthy,vegetable' },
      { char: '🍲', name: 'pot of food', tags: 'pot,soup,stew' },
      { char: '🍜', name: 'steaming bowl', tags: 'bowl,ramen,noodles,soup' },
      { char: '🍣', name: 'sushi', tags: 'sushi,japan,fish' },
      { char: '🍱', name: 'bento box', tags: 'bento,box,japan' },
      { char: '🥟', name: 'dumpling', tags: 'dumpling,asian,food' },
      { char: '🍤', name: 'fried shrimp', tags: 'fried shrimp,tempura,seafood' },
      { char: '🍨', name: 'ice cream', tags: 'ice cream,sweet,dessert' },
      { char: '🍦', name: 'soft ice cream', tags: 'soft ice cream,sweet,dessert' },
      { char: '🥧', name: 'pie', tags: 'pie,bakery,dessert' },
      { char: '🍰', name: 'shortcake', tags: 'shortcake,cake,dessert,sweet' },
      { char: '🎂', name: 'birthday cake', tags: 'birthday cake,cake,celebrate,party' },
      { char: '🍫', name: 'chocolate bar', tags: 'chocolate,sweet,dessert' },
      { char: '🍬', name: 'candy', tags: 'candy,sweet' },
      { char: '🍭', name: 'lollipop', tags: 'lollipop,candy,sweet' },
      { char: '🍪', name: 'cookie', tags: 'cookie,sweet,biscuit' },
      { char: '🍩', name: 'doughnut', tags: 'doughnut,donut,sweet' },
      { char: '🍿', name: 'popcorn', tags: 'popcorn,movie,snack' },
      { char: '🍯', name: 'honey pot', tags: 'honey,sweet' },
      { char: '🥛', name: 'glass of milk', tags: 'milk,drink' },
      { char: '☕', name: 'hot beverage', tags: 'coffee,tea,hot,drink,cafe' },
      { char: '🍵', name: 'teacup without handle', tags: 'teacup,tea,green tea,drink' },
      { char: '🥤', name: 'cup with straw', tags: 'straw,cup,soda,drink' },
      { char: '🍶', name: 'sake', tags: 'sake,drink,japan' },
      { char: '🍺', name: 'beer mug', tags: 'beer,mug,drink,alcohol' },
      { char: '🍻', name: 'clinking beer mugs', tags: 'clinking,beer,mugs,drink,party' },
      { char: '🥂', name: 'clinking glasses', tags: 'clinking,glasses,cheers,party,wine' },
      { char: '🍷', name: 'wine glass', tags: 'wine,glass,drink,alcohol' },
      { char: '🥃', name: 'tumbler glass', tags: 'tumbler,whiskey,glass,drink,alcohol' },
      { char: '🍸', name: 'cocktail glass', tags: 'cocktail,martini,drink,alcohol' },
      { char: '🍹', name: 'tropical drink', tags: 'tropical,drink,beach,alcohol' },
      { char: '🍾', name: 'bottle with popping cork', tags: 'bottle,popping,cork,champagne,celebrate' },
      { char: '🧊', name: 'ice', tags: 'ice,cold,cube' }
    ]
  },
  {
    id: 'activities',
    name: 'Activities & Sports',
    icon: '⚽',
    emojis: [
      { char: '⚽', name: 'soccer ball', tags: 'soccer,football,ball,sport' },
      { char: '🏀', name: 'basketball', tags: 'basketball,ball,sport' },
      { char: '🏈', name: 'american football', tags: 'american football,ball,sport' },
      { char: '⚾', name: 'baseball', tags: 'baseball,ball,sport' },
      { char: '🥎', name: 'softball', tags: 'softball,ball,sport' },
      { char: '🎾', name: 'tennis', tags: 'tennis,ball,sport' },
      { char: '🏐', name: 'volleyball', tags: 'volleyball,ball,sport' },
      { char: '🏉', name: 'rugby football', tags: 'rugby,football,ball,sport' },
      { char: '🥏', name: 'flying disc', tags: 'flying disc,frisbee,sport' },
      { char: '🎱', name: 'pool 8 ball', tags: 'pool,8 ball,billiards,game' },
      { char: '🏓', name: 'ping pong', tags: 'ping pong,table tennis,sport' },
      { char: '🏸', name: 'badminton', tags: 'badminton,sport' },
      { char: '🥅', name: 'goal net', tags: 'goal,net,sport' },
      { char: '⛳', name: 'flag in hole', tags: 'flag,hole,golf,sport' },
      { char: '🏹', name: 'bow and arrow', tags: 'bow,arrow,archery,sport' },
      { char: '🎣', name: 'fishing pole', tags: 'fishing pole,fish,sport' },
      { char: '🥊', name: 'boxing glove', tags: 'boxing glove,box,sport' },
      { char: '🥋', name: 'martial arts uniform', tags: 'martial arts,karate,judo,sport' },
      { char: '🛹', name: 'skateboard', tags: 'skateboard,skate,board' },
      { char: '⛸️', name: 'ice skate', tags: 'ice skate,skate,winter' },
      { char: '🏋️', name: 'person lifting weights', tags: 'lifting weights,weight,gym,workout,sport' },
      { char: '🤸', name: 'person cartwheeling', tags: 'cartwheeling,gymnastics,sport' },
      { char: '⛹️', name: 'person bouncing ball', tags: 'bouncing ball,basketball,sport' },
      { char: '🧘', name: 'person in lotus position', tags: 'lotus position,yoga,meditation,zen' },
      { char: '🏄', name: 'person surfing', tags: 'surfing,surfboard,beach,sport' },
      { char: '🏊', name: 'person swimming', tags: 'swimming,pool,sport' },
      { char: '🚣', name: 'person rowing boat', tags: 'rowing,boat,sport' },
      { char: '🧗', name: 'person climbing', tags: 'climbing,mountain,sport' },
      { char: '🚴', name: 'person biking', tags: 'biking,bicycle,sport' },
      { char: '🏆', name: 'trophy', tags: 'trophy,winner,award,first' },
      { char: '🥇', name: '1st place medal', tags: '1st,medal,gold,winner' },
      { char: '🥈', name: '2nd place medal', tags: '2nd,medal,silver,winner' },
      { char: '🥉', name: '3rd place medal', tags: '3rd,medal,bronze,winner' },
      { char: '🏅', name: 'sports medal', tags: 'sports,medal,award' },
      { char: '🎫', name: 'ticket', tags: 'ticket,event,show' },
      { char: '🎟️', name: 'admission tickets', tags: 'admission,tickets,movie,event' },
      { char: '🎭', name: 'performing arts', tags: 'performing arts,theater,mask,drama' },
      { char: '🎨', name: 'artist palette', tags: 'artist palette,art,paint,draw' },
      { char: '🎬', name: 'clapper board', tags: 'clapper board,movie,film' },
      { char: '🎮', name: 'video game', tags: 'video game,controller,play' }
    ]
  },
  {
    id: 'travel',
    name: 'Travel & Places',
    icon: '🚗',
    emojis: [
      { char: '🚗', name: 'automobile', tags: 'automobile,car,travel,drive' },
      { char: '🚕', name: 'taxi', tags: 'taxi,cab,car,travel' },
      { char: '🚙', name: 'sport utility vehicle', tags: 'suv,car,travel' },
      { char: '🚌', name: 'bus', tags: 'bus,travel,transit' },
      { char: '🏎️', name: 'racing car', tags: 'racing,car,speed,race' },
      { char: '🚓', name: 'police car', tags: 'police,car,cop' },
      { char: '🚑', name: 'ambulance', tags: 'ambulance,hospital,emergency' },
      { char: '🚒', name: 'fire engine', tags: 'fire engine,firefighter,emergency' },
      { char: '🚐', name: 'minibus', tags: 'minibus,van,travel' },
      { char: '🚚', name: 'delivery truck', tags: 'delivery,truck,package' },
      { char: '🚜', name: 'tractor', tags: 'tractor,farm,agricultural' },
      { char: '🏍️', name: 'motorcycle', tags: 'motorcycle,bike,speed' },
      { char: '🛵', name: 'motor scooter', tags: 'scooter,vespa,travel' },
      { char: '🚲', name: 'bicycle', tags: 'bicycle,bike,travel' },
      { char: '🛴', name: 'kick scooter', tags: 'kick,scooter,ride' },
      { char: '🚨', name: 'police car light', tags: 'police light,siren,alert,emergency' },
      { char: '⚓', name: 'anchor', tags: 'anchor,boat,ship,sea' },
      { char: '⛵', name: 'sailboat', tags: 'sailboat,boat,sea' },
      { char: '🛳️', name: 'passenger ship', tags: 'passenger,ship,boat,cruise' },
      { char: '⛴️', name: 'ferry', tags: 'ferry,boat,sea' },
      { char: '🛥️', name: 'motorboat', tags: 'motorboat,boat,speed' },
      { char: '🚢', name: 'ship', tags: 'ship,boat,ocean' },
      { char: '✈️', name: 'airplane', tags: 'airplane,plane,fly,travel' },
      { char: '🛫', name: 'airplane departure', tags: 'departure,plane,takeoff,travel' },
      { char: '🛬', name: 'airplane arrival', tags: 'arrival,plane,landing,travel' },
      { char: '🚀', name: 'rocket', tags: 'rocket,space,launch,cool' },
      { char: '🛸', name: 'flying saucer', tags: 'flying saucer,ufo,space,alien' },
      { char: '🚁', name: 'helicopter', tags: 'helicopter,copter,fly' },
      { char: '🧳', name: 'luggage', tags: 'luggage,suitcase,travel,trip' },
      { char: '⌛', name: 'hourglass done', tags: 'hourglass,time,sand' },
      { char: '⏳', name: 'hourglass not done', tags: 'hourglass,time,sand' },
      { char: '⌚', name: 'watch', tags: 'watch,clock,time' },
      { char: '⏰', name: 'alarm clock', tags: 'alarm,clock,time,wake up' },
      { char: '🗺️', name: 'world map', tags: 'world,map,travel,geography' },
      { char: '🌋', name: 'volcano', tags: 'volcano,nature,hot,lava' },
      { char: '🏔️', name: 'snow-capped mountain', tags: 'mountain,snow,cold,nature' },
      { char: '🏕️', name: 'camping', tags: 'camping,tent,nature,outdoor' },
      { char: '🏖️', name: 'beach with umbrella', tags: 'beach,umbrella,summer,sand,island' },
      { char: '🏜️', name: 'desert', tags: 'desert,cactus,hot,sand' },
      { char: '🏝️', name: 'desert island', tags: 'island,beach,tropical' },
      { char: '🏙️', name: 'cityscape', tags: 'cityscape,city,buildings' },
      { char: '🏰', name: 'castle', tags: 'castle,disney,royal' }
    ]
  },
  {
    id: 'objects',
    name: 'Objects',
    icon: '💡',
    emojis: [
      { char: '📱', name: 'mobile phone', tags: 'mobile,phone,smartphone,cell' },
      { char: '💻', name: 'laptop', tags: 'laptop,computer,pc,work' },
      { char: '⌨️', name: 'keyboard', tags: 'keyboard,computer,typing' },
      { char: '🖥️', name: 'desktop computer', tags: 'desktop,computer,screen' },
      { char: '🖨️', name: 'printer', tags: 'printer,office,print' },
      { char: '🖱️', name: 'computer mouse', tags: 'mouse,computer,click' },
      { char: '🎛️', name: 'control knobs', tags: 'knobs,control,settings' },
      { char: '🎙️', name: 'studio microphone', tags: 'microphone,mic,sing,record' },
      { char: '🎧', name: 'headphone', tags: 'headphone,music,listen,audio' },
      { char: '📻', name: 'radio', tags: 'radio,music,broadcast' },
      { char: '📺', name: 'television', tags: 'television,tv,screen,show' },
      { char: '📷', name: 'camera', tags: 'camera,photo,shoot' },
      { char: '📸', name: 'camera with flash', tags: 'camera,flash,photo,shoot' },
      { char: '🔍', name: 'magnifying glass pointed left', tags: 'magnifying,glass,search,find,zoom' },
      { char: '🔎', name: 'magnifying glass pointed right', tags: 'magnifying,glass,search,find,zoom' },
      { char: '💡', name: 'light bulb', tags: 'light bulb,idea,smart,bright' },
      { char: '🔦', name: 'flashlight', tags: 'flashlight,light,dark' },
      { char: '🏮', name: 'red paper lantern', tags: 'lantern,light,china' },
      { char: '✉️', name: 'envelope', tags: 'envelope,mail,letter,email' },
      { char: '📩', name: 'envelope with arrow', tags: 'envelope,arrow,mail,receive' },
      { char: '📦', name: 'package', tags: 'package,box,delivery' },
      { char: '🏷️', name: 'label', tags: 'label,tag,price' },
      { char: '💳', name: 'credit card', tags: 'credit card,card,money,pay' },
      { char: '💸', name: 'money with wings', tags: 'money,wings,cash,spend' },
      { char: '💵', name: 'dollar banknote', tags: 'dollar,banknote,cash,money' },
      { char: '🪙', name: 'coin', tags: 'coin,money,gold' },
      { char: '🛡️', name: 'shield', tags: 'shield,protection,defense,secure,safety' },
      { char: '🔑', name: 'key', tags: 'key,lock,password,secure,access' },
      { char: '🗝️', name: 'old key', tags: 'old key,antique,secure,access' },
      { char: '🔨', name: 'hammer', tags: 'hammer,tool,build' },
      { char: '🛠️', name: 'hammer and wrench', tags: 'hammer,wrench,tools,build,repair' },
      { char: '🔩', name: 'nut and bolt', tags: 'nut,bolt,metal,tool' },
      { char: '⚙️', name: 'gear', tags: 'gear,settings,cog,engine' },
      { char: '🧪', name: 'test tube', tags: 'test tube,chemistry,science,lab' },
      { char: '🔬', name: 'microscope', tags: 'microscope,science,lab,magnify' },
      { char: '🔭', name: 'telescope', tags: 'telescope,space,stars,science' },
      { char: '📡', name: 'satellite antenna', tags: 'satellite,antenna,dish,signal' },
      { char: '💊', name: 'pill', tags: 'pill,medicine,drug,sick' },
      { char: '💉', name: 'syringe', tags: 'syringe,medicine,vaccine,shot,needle' },
      { char: '🩺', name: 'stethoscope', tags: 'stethoscope,doctor,medicine,health' },
      { char: '🩸', name: 'blood drop', tags: 'blood,sick,health' },
      { char: '🩹', name: 'adhesive bandage', tags: 'bandage,bandaid,wound,heal' },
      { char: '🪞', name: 'mirror', tags: 'mirror,glass,reflect' },
      { char: '🚪', name: 'door', tags: 'door,exit,enter' },
      { char: '🛏️', name: 'bed', tags: 'bed,sleep,hotel' },
      { char: '🛋️', name: 'couch and lamp', tags: 'couch,sofa,furniture,living room' },
      { char: '🪑', name: 'chair', tags: 'chair,seat,furniture' },
      { char: '🚽', name: 'toilet', tags: 'toilet,bathroom' },
      { char: '🚿', name: 'shower', tags: 'shower,wash,bathroom' },
      { char: '🛁', name: 'bathtub', tags: 'bathtub,bath,wash' },
      { char: '🧹', name: 'broom', tags: 'broom,clean,witch' },
      { char: '🧽', name: 'sponge', tags: 'sponge,clean,wash' },
      { char: '📎', name: 'paperclip', tags: 'paperclip,attachment,office' },
      { char: '🖇️', name: 'linked paperclips', tags: 'paperclips,attachment,office' },
      { char: '📐', name: 'triangular ruler', tags: 'ruler,triangle,math,school' },
      { char: '📏', name: 'straight ruler', tags: 'ruler,straight,math,school' },
      { char: '📌', name: 'pushpin', tags: 'pushpin,pin,map,office' },
      { char: '📍', name: 'round pushpin', tags: 'pushpin,pin,location,map' },
      { char: '✂️', name: 'scissors', tags: 'scissors,cut,office' },
      { char: '🖊️', name: 'pen', tags: 'pen,write,office' },
      { char: '✏️', name: 'pencil', tags: 'pencil,write,draw' },
      { char: '📝', name: 'memo', tags: 'memo,note,write,paper' },
      { char: '📁', name: 'folder', tags: 'folder,file,office' },
      { char: '📂', name: 'open folder', tags: 'folder,file,open' },
      { char: '📅', name: 'calendar', tags: 'calendar,date,schedule' },
      { char: '📆', name: 'tear-off calendar', tags: 'calendar,date,schedule' },
      { char: '🗓️', name: 'spiral calendar', tags: 'calendar,date,schedule' },
      { char: '🔒', name: 'locked', tags: 'locked,secure,password,privacy' },
      { char: '🔓', name: 'unlocked', tags: 'unlocked,open,access' },
      { char: '🔏', name: 'locked with pen', tags: 'locked,pen,signature,privacy,encryption' },
      { char: '🔐', name: 'locked with key', tags: 'locked,key,password,privacy,security' },
      { char: '⚔️', name: 'crossed swords', tags: 'swords,crossed,fight,battle' },
      { char: '⚖️', name: 'balance scale', tags: 'scale,balance,justice,law' },
      { char: '🦯', name: 'white cane', tags: 'white cane,blind,accessibility' },
      { char: '🧲', name: 'magnet', tags: 'magnet,attract,pull' },
      { char: '💣', name: 'bomb', tags: 'bomb,explosion,dangerous' },
      { char: '🕳️', name: 'hole', tags: 'hole,empty,pit' }
    ]
  },
  {
    id: 'symbols',
    name: 'Symbols & Hearts',
    icon: '❤️',
    emojis: [
      { char: '💘', name: 'heart with arrow', tags: 'heart,arrow,love,romance' },
      { char: '💝', name: 'heart with ribbon', tags: 'heart,ribbon,gift,love' },
      { char: '💖', name: 'sparkling heart', tags: 'heart,sparkles,love,pretty' },
      { char: '💗', name: 'growing heart', tags: 'heart,growing,love' },
      { char: '💓', name: 'beating heart', tags: 'heart,beating,pulse,love' },
      { char: '💞', name: 'revolving hearts', tags: 'hearts,revolving,love' },
      { char: '💕', name: 'two hearts', tags: 'two hearts,love,affection' },
      { char: '💟', name: 'heart decoration', tags: 'heart,decoration,love' },
      { char: '❣️', name: 'heart exclamation', tags: 'heart,exclamation,mark,love' },
      { char: '💔', name: 'broken heart', tags: 'broken heart,sad,divorce,love' },
      { char: '❤️', name: 'red heart', tags: 'red heart,love,like,heart' },
      { char: '🧡', name: 'orange heart', tags: 'orange heart,love,heart' },
      { char: '💛', name: 'yellow heart', tags: 'yellow heart,love,heart' },
      { char: '💚', name: 'green heart', tags: 'green heart,love,heart' },
      { char: '💙', name: 'blue heart', tags: 'blue heart,love,heart' },
      { char: '💜', name: 'purple heart', tags: 'purple heart,love,heart' },
      { char: '🖤', name: 'black heart', tags: 'black heart,love,heart' },
      { char: '🤍', name: 'white heart', tags: 'white heart,love,heart' },
      { char: '🤎', name: 'brown heart', tags: 'brown heart,love,heart' },
      { char: '💯', name: 'hundred points', tags: '100,perfect,score,hundred' },
      { char: '💢', name: 'anger symbol', tags: 'anger,symbol,mad,angry' },
      { char: '💥', name: 'collision', tags: 'collision,blast,explosion,boom' },
      { char: '💫', name: 'dizzy', tags: 'dizzy,star,sparkle' },
      { char: '💦', name: 'sweat droplets', tags: 'sweat,droplets,water,splash' },
      { char: '💨', name: 'dashing away', tags: 'dashing,wind,run,fast' },
      { char: '💬', name: 'speech balloon', tags: 'speech,balloon,bubble,chat,message' },
      { char: '💭', name: 'thought balloon', tags: 'thought,balloon,bubble,think' },
      { char: '💤', name: 'zzz', tags: 'zzz,sleep,snore,tired' },
      { char: '🌐', name: 'globe with meridians', tags: 'globe,meridians,internet,world,web' },
      { char: '💠', name: 'diamond with a dot', tags: 'diamond,dot,pretty' },
      { char: '🌀', name: 'cyclone', tags: 'cyclone,hurricane,tornado,spiral' },
      { char: '⚠️', name: 'warning', tags: 'warning,alert,danger,caution' },
      { char: '⛔', name: 'no entry', tags: 'no entry,stop,forbidden' },
      { char: '🚫', name: 'prohibited', tags: 'prohibited,no,forbidden,ban' },
      { char: '🚭', name: 'no smoking', tags: 'no smoking,ban' },
      { char: '🚯', name: 'no littering', tags: 'no littering,ban' },
      { char: '🚷', name: 'no pedestrians', tags: 'no pedestrians,ban' },
      { char: '🆕', name: 'new', tags: 'new,button' },
      { char: '🆗', name: 'ok button', tags: 'ok,button,agree,yes' },
      { char: '🆙', name: 'up button', tags: 'up,button' },
      { char: '🆒', name: 'cool button', tags: 'cool,button' },
      { char: '🆓', name: 'free button', tags: 'free,button' },
      { char: '🔀', name: 'shuffle tracks button', tags: 'shuffle,tracks,button' },
      { char: '🔁', name: 'repeat button', tags: 'repeat,button' },
      { char: '🔂', name: 'repeat single button', tags: 'repeat single,button' },
      { char: '▶️', name: 'play button', tags: 'play,button' },
      { char: '⏩', name: 'fast-forward button', tags: 'fast-forward,button' },
      { char: '⏭️', name: 'next track button', tags: 'next track,button' },
      { char: '⏯️', name: 'play or pause button', tags: 'play,pause,button' },
      { char: '◀️', name: 'reverse button', tags: 'reverse,button' },
      { char: '⏪', name: 'fast reverse button', tags: 'fast reverse,button' },
      { char: '⏮️', name: 'last track button', tags: 'last track,button' },
      { char: '🔼', name: 'upwards button', tags: 'upwards,button' },
      { char: '⏫', name: 'fast up button', tags: 'fast up,button' },
      { char: '🔽', name: 'downwards button', tags: 'downwards,button' },
      { char: '⏬', name: 'fast down button', tags: 'fast down,button' },
      { char: '⏸️', name: 'pause button', tags: 'pause,button' },
      { char: '⏹️', name: 'stop button', tags: 'stop,button' },
      { char: '⏺️', name: 'record button', tags: 'record,button' },
      { char: '⏏️', name: 'eject button', tags: 'eject,button' },
      { char: '♀️', name: 'female sign', tags: 'female,sign,woman' },
      { char: '♂️', name: 'male sign', tags: 'male,sign,man' },
      { char: '⚧️', name: 'transgender symbol', tags: 'transgender,symbol' },
      { char: '✖️', name: 'multiply', tags: 'multiply,cross,close,delete,math' },
      { char: '➕', name: 'plus', tags: 'plus,add,math' },
      { char: '➖', name: 'minus', tags: 'minus,subtract,math' },
      { char: '➗', name: 'divide', tags: 'divide,math' },
      { char: '♾️', name: 'infinity', tags: 'infinity,forever' },
      { char: '‼️', name: 'double exclamation mark', tags: 'double,exclamation,alert' },
      { char: '⁉️', name: 'exclamation question mark', tags: 'exclamation,question,huh' },
      { char: '❓', name: 'question mark', tags: 'question,huh,what' },
      { char: '❔', name: 'white question mark', tags: 'question,huh,what' },
      { char: '❕', name: 'white exclamation mark', tags: 'exclamation,alert' },
      { char: '❗️', name: 'exclamation mark', tags: 'exclamation,alert,warn' },
      { char: '⚕️', name: 'medical symbol', tags: 'medical,symbol,health,doctor' },
      { char: '⚖️', name: 'scales', tags: 'scales,justice,law' },
      { char: '♻️', name: 'recycling symbol', tags: 'recycling,green,recycle' },
      { char: '⚜️', name: 'fleur-de-lis', tags: 'fleur-de-lis,french,lily' },
      { char: '🔱', name: 'trident emblem', tags: 'trident,emblem,poseidon' },
      { char: '📛', name: 'name badge', tags: 'name badge,tag' },
      { char: '🔰', name: 'japanese symbol for beginner', tags: 'beginner,green,yellow,shield' },
      { char: '⭕', name: 'hollow red circle', tags: 'circle,red,ok' },
      { char: '✅', name: 'check mark button', tags: 'check,mark,agree,yes,correct' },
      { char: '☑️', name: 'check box with check', tags: 'check,box,yes' },
      { char: '✔️', name: 'check mark', tags: 'check,mark,yes,correct' },
      { char: '❌', name: 'cross mark', tags: 'cross,no,wrong,delete,math' },
      { char: '❎', name: 'cross mark button', tags: 'cross,no,wrong,button' },
      { char: '🔴', name: 'red circle', tags: 'red,circle,dot' },
      { char: '🔵', name: 'blue circle', tags: 'blue,circle,dot' },
      { char: '⚫', name: 'black circle', tags: 'black,circle,dot' },
      { char: '⚪', name: 'white circle', tags: 'white,circle,dot' }
    ]
  }
];

const EmojiPicker = ({ onSelect, onClose, triggerRef }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [recentEmojis, setRecentEmojis] = useState(() => {
    try {
      const saved = localStorage.getItem('securechat_recent_emojis');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const pickerRef = useRef(null);
  const categoryRefs = useRef({});
  const scrollContainerRef = useRef(null);

  // Click outside handling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        (!triggerRef || !triggerRef.current || !triggerRef.current.contains(event.target))
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, triggerRef]);

  // Handle emoji selection
  const handleEmojiClick = (char) => {
    onSelect(char);

    // Save to recents
    const updatedRecents = [char, ...recentEmojis.filter((e) => e !== char)].slice(0, 16);
    setRecentEmojis(updatedRecents);
    try {
      localStorage.setItem('securechat_recent_emojis', JSON.stringify(updatedRecents));
    } catch (err) {
      console.warn('Failed to save recent emojis:', err);
    }
  };

  // Scroll to category
  const scrollToCategory = (categoryId) => {
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: element.offsetTop - 12,
        behavior: 'smooth',
      });
    }
  };

  // Handle active category highlighting based on scroll position
  const handleScroll = () => {
    if (searchQuery) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    let currentCategory = activeCategory;
    let minDiff = Infinity;

    EMOJI_CATEGORIES.forEach((cat) => {
      const element = categoryRefs.current[cat.id];
      if (element) {
        const diff = Math.abs(element.offsetTop - container.scrollTop - 12);
        if (diff < minDiff) {
          minDiff = diff;
          currentCategory = cat.id;
        }
      }
    });

    if (recentEmojis.length > 0) {
      const recentElement = categoryRefs.current['recent'];
      if (recentElement) {
        const diff = Math.abs(recentElement.offsetTop - container.scrollTop - 12);
        if (diff < minDiff) {
          currentCategory = 'recent';
        }
      }
    }

    if (currentCategory !== activeCategory) {
      setActiveCategory(currentCategory);
    }
  };

  // Filter emojis based on search
  const getFilteredEmojis = () => {
    if (!searchQuery) return null;
    const query = searchQuery.toLowerCase().trim();
    const matches = [];

    EMOJI_CATEGORIES.forEach((cat) => {
      cat.emojis.forEach((emoji) => {
        if (
          emoji.name.toLowerCase().includes(query) ||
          emoji.tags.toLowerCase().includes(query)
        ) {
          matches.push(emoji);
        }
      });
    });

    // Remove duplicates
    return matches.filter((value, index, self) =>
      self.findIndex((t) => t.char === value.char) === index
    );
  };

  const filtered = getFilteredEmojis();

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="absolute bottom-full mb-3 left-0 w-[320px] h-[360px] bg-surface-container-high/90 backdrop-blur-xl border border-outline-variant/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 select-none font-sans text-on-surface"
    >
      {/* Search Header */}
      <div className="p-3 pb-2 border-b border-outline-variant/20 flex-shrink-0">
        <div className="flex items-center space-x-2 bg-surface-container-highest/80 border border-outline-variant/30 rounded-xl px-3 py-1.5 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/40 transition-all duration-200">
          <Search className="h-4 w-4 text-on-surface-variant/40 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-0 outline-none text-xs text-on-surface placeholder:text-on-surface-variant/40 flex-1 py-0.5"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-on-surface-variant/60 hover:text-on-surface px-1 bg-surface-container-low rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Emoji Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin overflow-x-hidden"
      >
        {searchQuery ? (
          /* Search Results */
          <div className="pt-2">
            <div className="text-[10px] text-primary/60 font-code font-bold uppercase tracking-wider mb-2 mt-1">
              Search Results ({filtered.length})
            </div>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-8 gap-1">
                {filtered.map((emoji) => (
                  <button
                    key={emoji.char}
                    onClick={() => handleEmojiClick(emoji.char)}
                    title={emoji.name}
                    className="h-8 w-8 text-lg rounded-lg hover:bg-primary-container/20 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                  >
                    {emoji.char}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-on-surface-variant/40">
                No matching emojis found.
              </div>
            )}
          </div>
        ) : (
          /* Categorized Emojis */
          <>
            {/* Recent Emojis */}
            {recentEmojis.length > 0 && (
              <div
                key="recent-section"
                ref={(el) => (categoryRefs.current['recent'] = el)}
                className="pt-2"
              >
                <div className="text-[10px] text-primary/60 font-code font-bold uppercase tracking-wider mb-2 mt-1">
                  Recently Used
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {recentEmojis.map((char, index) => (
                    <button
                      key={`recent-${char}-${index}`}
                      onClick={() => handleEmojiClick(char)}
                      className="h-8 w-8 text-lg rounded-lg hover:bg-primary-container/20 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Categories */}
            {EMOJI_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                ref={(el) => (categoryRefs.current[cat.id] = el)}
                className="pt-2"
              >
                <div className="text-[10px] text-primary/60 font-code font-bold uppercase tracking-wider mb-2 mt-2">
                  {cat.name}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji.char}
                      onClick={() => handleEmojiClick(emoji.char)}
                      title={emoji.name}
                      className="h-8 w-8 text-lg rounded-lg hover:bg-primary-container/20 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                    >
                      {emoji.char}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Bottom Category Tabs */}
      {!searchQuery && (
        <div className="flex justify-between items-center bg-surface-container-highest/60 border-t border-outline-variant/20 px-2 py-1 flex-shrink-0">
          {recentEmojis.length > 0 && (
            <button
              onClick={() => scrollToCategory('recent')}
              className={`p-1.5 rounded-lg text-xs hover:bg-primary-container/10 active:scale-95 transition-all flex-1 text-center cursor-pointer ${
                activeCategory === 'recent' ? 'bg-primary-container/20 border border-primary/20 scale-105' : ''
              }`}
              title="Recent"
            >
              ⏳
            </button>
          )}
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`p-1.5 rounded-lg text-xs hover:bg-primary-container/10 active:scale-95 transition-all flex-1 text-center cursor-pointer ${
                activeCategory === cat.id ? 'bg-primary-container/20 border border-primary/20 scale-105' : ''
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default EmojiPicker;
