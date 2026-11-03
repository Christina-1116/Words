/**
 * 内置词库（离线可用）。
 * 字族：每字 9 词，配比「3 本义 B + 3 生活 L + 2 动作 A + 1 反差 C」。
 * 词条格式：[词, 拼音, 英文, 类别, emoji, 图标描述(英文, 给生图模型用)]
 * 物品：拍照识字的离线示例 / 兜底词典。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HZLexicon = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var FAMILY = {
    '小': { py: 'xiǎo', en: 'small', words: [
      ['小鸟', 'xiǎo niǎo', 'little bird', 'B', '🐦', 'a tiny round songbird on a twig'],
      ['小草', 'xiǎo cǎo', 'grass', 'B', '🌱', 'a small sprout of green grass'],
      ['小猫', 'xiǎo māo', 'kitten', 'B', '🐱', 'a cute sitting kitten'],
      ['小学', 'xiǎo xué', 'primary school', 'L', '🏫', 'a red-brick primary school building with a flag'],
      ['小吃', 'xiǎo chī', 'snack food', 'L', '🍢', 'a paper cup of street snacks on skewers'],
      ['小时', 'xiǎo shí', 'hour', 'L', '🕐', 'a round wall clock'],
      ['缩小', 'suō xiǎo', 'to shrink', 'A', '🔍', 'a big square shrinking into a small square'],
      ['减小', 'jiǎn xiǎo', 'to reduce', 'A', '📉', 'a descending bar chart arrow'],
      ['小气', 'xiǎo qì', 'stingy', 'C', '🪙', 'a hand clutching one gold coin tightly']]},
    '大': { py: 'dà', en: 'big', words: [
      ['大象', 'dà xiàng', 'elephant', 'B', '🐘', 'a friendly grey elephant'],
      ['大海', 'dà hǎi', 'sea', 'B', '🌊', 'rolling blue ocean waves'],
      ['大树', 'dà shù', 'big tree', 'B', '🌳', 'a large leafy tree'],
      ['大人', 'dà rén', 'grown-up', 'L', '🧑', 'an adult holding a child\'s hand'],
      ['大学', 'dà xué', 'university', 'L', '🎓', 'a graduation cap'],
      ['大门', 'dà mén', 'front gate', 'L', '🚪', 'a big red double gate'],
      ['放大', 'fàng dà', 'to enlarge', 'A', '🔎', 'a magnifying glass enlarging a dot'],
      ['长大', 'zhǎng dà', 'to grow up', 'A', '🌱', 'a seedling growing taller in three steps'],
      ['大胆', 'dà dǎn', 'bold', 'C', '🦁', 'a small kitten casting a lion-shaped shadow']]},
    '明': { py: 'míng', en: 'bright', words: [
      ['明亮', 'míng liàng', 'bright', 'B', '✨', 'a sparkling light burst'],
      ['明月', 'míng yuè', 'bright moon', 'B', '🌕', 'a glowing full moon'],
      ['明灯', 'míng dēng', 'bright lamp', 'B', '🪔', 'a small oil lamp with a warm flame'],
      ['明天', 'míng tiān', 'tomorrow', 'L', '📅', 'a calendar page with a rising sun'],
      ['明星', 'míng xīng', 'star', 'L', '🌟', 'a shining five-pointed star'],
      ['明信片', 'míng xìn piàn', 'postcard', 'L', '💌', 'a postcard with a stamp'],
      ['说明', 'shuō míng', 'to explain', 'A', '💬', 'a speech bubble with a lightbulb'],
      ['发明', 'fā míng', 'to invent', 'A', '💡', 'a glowing lightbulb with gears'],
      ['小聪明', 'xiǎo cōng míng', 'petty cleverness', 'C', '🦊', 'a sly little fox winking']]},
    '人': { py: 'rén', en: 'person', words: [
      ['人类', 'rén lèi', 'humankind', 'B', '🌍', 'the earth with tiny people around it'],
      ['人口', 'rén kǒu', 'population', 'B', '👨‍👩‍👧', 'a row of simple people figures'],
      ['好人', 'hǎo rén', 'good person', 'B', '😇', 'a smiling person with a halo'],
      ['家人', 'jiā rén', 'family', 'L', '🏠', 'a small house with a family inside'],
      ['客人', 'kè rén', 'guest', 'L', '🛎️', 'a guest ringing a doorbell'],
      ['主人', 'zhǔ rén', 'owner', 'L', '🐕', 'a dog looking up at its owner'],
      ['救人', 'jiù rén', 'to rescue', 'A', '🛟', 'a life ring buoy'],
      ['待人', 'dài rén', 'to treat others', 'A', '🤝', 'two hands shaking'],
      ['雪人', 'xuě rén', 'snowman', 'C', '⛄', 'a snowman with a carrot nose']]},
    '山': { py: 'shān', en: 'mountain', words: [
      ['高山', 'gāo shān', 'high mountain', 'B', '🏔️', 'a snow-capped mountain peak'],
      ['山顶', 'shān dǐng', 'mountaintop', 'B', '⛰️', 'a flag on top of a mountain'],
      ['火山', 'huǒ shān', 'volcano', 'B', '🌋', 'a volcano puffing smoke'],
      ['山路', 'shān lù', 'mountain road', 'L', '🛤️', 'a winding path up a hill'],
      ['山羊', 'shān yáng', 'goat', 'L', '🐐', 'a white goat with small horns'],
      ['山水', 'shān shuǐ', 'landscape', 'L', '🏞️', 'mountains with a river and mist'],
      ['爬山', 'pá shān', 'to climb', 'A', '🧗', 'a child climbing a hill'],
      ['登山', 'dēng shān', 'to hike', 'A', '🥾', 'a hiking boot'],
      ['冰山', 'bīng shān', 'iceberg', 'C', '🧊', 'an iceberg floating, mostly under water']]},
    '水': { py: 'shuǐ', en: 'water', words: [
      ['河水', 'hé shuǐ', 'river water', 'B', '🏞️', 'a flowing river'],
      ['雨水', 'yǔ shuǐ', 'rainwater', 'B', '🌧️', 'a cloud with raindrops'],
      ['海水', 'hǎi shuǐ', 'seawater', 'B', '🌊', 'a curling sea wave'],
      ['水杯', 'shuǐ bēi', 'cup', 'L', '🥛', 'a glass of water'],
      ['水果', 'shuǐ guǒ', 'fruit', 'L', '🍎', 'a bowl of mixed fruit'],
      ['水饺', 'shuǐ jiǎo', 'dumplings', 'L', '🥟', 'a plate of boiled dumplings'],
      ['喝水', 'hē shuǐ', 'to drink water', 'A', '🚰', 'a child drinking from a cup'],
      ['浇水', 'jiāo shuǐ', 'to water', 'A', '🪴', 'a watering can over a potted plant'],
      ['口水', 'kǒu shuǐ', 'drool', 'C', '🤤', 'a drooling face looking at cake']]},
    '火': { py: 'huǒ', en: 'fire', words: [
      ['火苗', 'huǒ miáo', 'flame', 'B', '🔥', 'a single orange flame'],
      ['火山', 'huǒ shān', 'volcano', 'B', '🌋', 'an erupting volcano'],
      ['篝火', 'gōu huǒ', 'bonfire', 'B', '🏕️', 'a campfire with logs'],
      ['火车', 'huǒ chē', 'train', 'L', '🚂', 'a steam train'],
      ['火锅', 'huǒ guō', 'hot pot', 'L', '🍲', 'a bubbling hot pot'],
      ['火柴', 'huǒ chái', 'match', 'L', '🕯️', 'a lit matchstick'],
      ['点火', 'diǎn huǒ', 'to light a fire', 'A', '🕯️', 'a hand lighting a candle'],
      ['灭火', 'miè huǒ', 'to put out fire', 'A', '🧯', 'a red fire extinguisher'],
      ['火鸡', 'huǒ jī', 'turkey', 'C', '🦃', 'a turkey with a fan tail']]},
    '日': { py: 'rì', en: 'sun; day', words: [
      ['日出', 'rì chū', 'sunrise', 'B', '🌅', 'the sun rising over the sea'],
      ['日落', 'rì luò', 'sunset', 'B', '🌇', 'a sunset behind hills'],
      ['红日', 'hóng rì', 'red sun', 'B', '🌞', 'a big red sun'],
      ['生日', 'shēng rì', 'birthday', 'L', '🎂', 'a birthday cake with candles'],
      ['日历', 'rì lì', 'calendar', 'L', '📆', 'a desk calendar'],
      ['日记', 'rì jì', 'diary', 'L', '📔', 'an open diary with a pencil'],
      ['值日', 'zhí rì', 'to be on duty', 'A', '🧹', 'a broom and dustpan'],
      ['日晒', 'rì shài', 'to sunbathe', 'A', '☀️', 'clothes drying under the sun'],
      ['向日葵', 'xiàng rì kuí', 'sunflower', 'C', '🌻', 'a sunflower facing the sun']]},
    '月': { py: 'yuè', en: 'moon; month', words: [
      ['月光', 'yuè guāng', 'moonlight', 'B', '🌙', 'moonlight over a quiet lake'],
      ['满月', 'mǎn yuè', 'full moon', 'B', '🌕', 'a round full moon'],
      ['月牙', 'yuè yá', 'crescent moon', 'B', '🌙', 'a thin crescent moon'],
      ['月饼', 'yuè bǐng', 'mooncake', 'L', '🥮', 'a patterned mooncake'],
      ['月份', 'yuè fèn', 'month', 'L', '🗓️', 'a monthly calendar grid'],
      ['月台', 'yuè tái', 'platform', 'L', '🚉', 'a train station platform'],
      ['赏月', 'shǎng yuè', 'to admire the moon', 'A', '🎑', 'a family looking at the moon'],
      ['登月', 'dēng yuè', 'moon landing', 'A', '🚀', 'a rocket flying to the moon'],
      ['蜜月', 'mì yuè', 'honeymoon', 'C', '🍯', 'a honey jar shaped like a moon']]},
    '天': { py: 'tiān', en: 'sky; day', words: [
      ['天空', 'tiān kōng', 'sky', 'B', '☁️', 'fluffy clouds in a blue sky'],
      ['蓝天', 'lán tiān', 'blue sky', 'B', '🩵', 'a clear blue sky with a bird'],
      ['天上', 'tiān shàng', 'in the sky', 'B', '🪁', 'a kite high in the sky'],
      ['今天', 'jīn tiān', 'today', 'L', '📅', 'a calendar with today circled'],
      ['天气', 'tiān qì', 'weather', 'L', '🌦️', 'sun behind a rain cloud'],
      ['春天', 'chūn tiān', 'spring', 'L', '🌸', 'cherry blossoms on a branch'],
      ['聊天', 'liáo tiān', 'to chat', 'A', '💬', 'two speech bubbles'],
      ['飞天', 'fēi tiān', 'to fly to the sky', 'A', '🚀', 'a rocket taking off'],
      ['天鹅', 'tiān é', 'swan', 'C', '🦢', 'a white swan on water']]},
    '心': { py: 'xīn', en: 'heart', words: [
      ['心脏', 'xīn zàng', 'heart', 'B', '❤️', 'a simple red heart'],
      ['爱心', 'ài xīn', 'love', 'B', '💗', 'two hands forming a heart'],
      ['心情', 'xīn qíng', 'mood', 'B', '😊', 'a smiling face'],
      ['中心', 'zhōng xīn', 'center', 'L', '🎯', 'a dartboard with a dart in the center'],
      ['手心', 'shǒu xīn', 'palm', 'L', '🤲', 'an open palm'],
      ['开心', 'kāi xīn', 'happy', 'L', '😄', 'a laughing child'],
      ['关心', 'guān xīn', 'to care', 'A', '🤗', 'a hug'],
      ['小心', 'xiǎo xīn', 'be careful', 'A', '⚠️', 'a yellow caution sign'],
      ['空心', 'kōng xīn', 'hollow', 'C', '🍩', 'a donut with a hole']]},
    '花': { py: 'huā', en: 'flower', words: [
      ['花朵', 'huā duǒ', 'blossom', 'B', '🌸', 'a pink blossom'],
      ['鲜花', 'xiān huā', 'fresh flowers', 'B', '💐', 'a bouquet of flowers'],
      ['花园', 'huā yuán', 'garden', 'B', '🏡', 'a small garden with a fence'],
      ['花生', 'huā shēng', 'peanut', 'L', '🥜', 'a peanut in its shell'],
      ['花瓶', 'huā píng', 'vase', 'L', '🏺', 'a porcelain vase'],
      ['烟花', 'yān huā', 'fireworks', 'L', '🎆', 'fireworks bursting at night'],
      ['种花', 'zhòng huā', 'to plant flowers', 'A', '🌷', 'a hand planting a tulip'],
      ['浇花', 'jiāo huā', 'to water flowers', 'A', '🚿', 'a watering can over flowers'],
      ['花钱', 'huā qián', 'to spend money', 'C', '💰', 'coins flying out of a wallet']]},
    '学': { py: 'xué', en: 'to learn', words: [
      ['学习', 'xué xí', 'to study', 'B', '📚', 'a stack of books'],
      ['学校', 'xué xiào', 'school', 'B', '🏫', 'a school building'],
      ['同学', 'tóng xué', 'classmate', 'B', '🧑‍🤝‍🧑', 'two kids holding hands'],
      ['上学', 'shàng xué', 'go to school', 'L', '🎒', 'a school backpack'],
      ['放学', 'fàng xué', 'school is over', 'L', '🔔', 'a school bell ringing'],
      ['大学', 'dà xué', 'university', 'L', '🎓', 'a graduation cap'],
      ['学画', 'xué huà', 'learn to draw', 'A', '🎨', 'a palette and brush'],
      ['学步', 'xué bù', 'learn to walk', 'A', '👣', 'small footprints'],
      ['学舌', 'xué shé', 'to parrot', 'C', '🦜', 'a parrot talking']]},
    '开': { py: 'kāi', en: 'to open', words: [
      ['开门', 'kāi mén', 'open the door', 'B', '🚪', 'a door opening with light inside'],
      ['打开', 'dǎ kāi', 'to open', 'B', '📦', 'an opened gift box'],
      ['开花', 'kāi huā', 'to bloom', 'B', '🌼', 'a flower bud blooming'],
      ['开学', 'kāi xué', 'school starts', 'L', '🎒', 'a backpack with new books'],
      ['开关', 'kāi guān', 'switch', 'L', '🔌', 'a light switch'],
      ['开水', 'kāi shuǐ', 'boiled water', 'L', '♨️', 'a steaming kettle'],
      ['开车', 'kāi chē', 'to drive', 'A', '🚗', 'a small car'],
      ['开会', 'kāi huì', 'have a meeting', 'A', '🗣️', 'people around a table'],
      ['开心', 'kāi xīn', 'happy', 'C', '😄', 'a heart opening like a door']]},
    '好': { py: 'hǎo', en: 'good', words: [
      ['好人', 'hǎo rén', 'good person', 'B', '😇', 'a smiling helper'],
      ['美好', 'měi hǎo', 'wonderful', 'B', '🌈', 'a rainbow'],
      ['友好', 'yǒu hǎo', 'friendly', 'B', '🤝', 'two hands shaking'],
      ['你好', 'nǐ hǎo', 'hello', 'L', '👋', 'a waving hand'],
      ['好吃', 'hǎo chī', 'delicious', 'L', '😋', 'a yummy face with a spoon'],
      ['好看', 'hǎo kàn', 'good-looking', 'L', '🌷', 'a pretty tulip'],
      ['问好', 'wèn hǎo', 'to greet', 'A', '🙋', 'a child raising a hand to greet'],
      ['叫好', 'jiào hǎo', 'to cheer', 'A', '👏', 'clapping hands'],
      ['爱好', 'ài hào', 'hobby', 'C', '🎨', 'a paintbrush, ball and guitar']]},
    '春': { py: 'chūn', en: 'spring', words: [
      ['春天', 'chūn tiān', 'spring', 'B', '🌸', 'cherry blossoms'],
      ['春风', 'chūn fēng', 'spring breeze', 'B', '🍃', 'leaves floating in the breeze'],
      ['春雨', 'chūn yǔ', 'spring rain', 'B', '🌦️', 'light rain over green fields'],
      ['春节', 'chūn jié', 'Spring Festival', 'L', '🧧', 'a red envelope'],
      ['春联', 'chūn lián', 'couplets', 'L', '🏮', 'red couplets on a door'],
      ['春卷', 'chūn juǎn', 'spring roll', 'L', '🌯', 'golden spring rolls'],
      ['踏春', 'tà chūn', 'spring outing', 'A', '🚶', 'a family walking in a meadow'],
      ['迎春', 'yíng chūn', 'welcome spring', 'A', '🎊', 'confetti and blossoms'],
      ['青春', 'qīng chūn', 'youth', 'C', '🧑', 'a teenager with a backpack']]}
  };

  // 拍照识字：常见家居物品（离线兜底）。[词, 拼音, 英文, emoji, 例句]
  var THINGS = [
    ['苹果', 'píng guǒ', 'apple', '🍎', '我每天吃一个苹果。'],
    ['橘子', 'jú zi', 'orange', '🍊', '橘子酸酸甜甜的。'],
    ['酸奶', 'suān nǎi', 'yogurt', '🥛', '早餐喝一杯酸奶。'],
    ['牛奶', 'niú nǎi', 'milk', '🥛', '牛奶白白的。'],
    ['鸡蛋', 'jī dàn', 'egg', '🥚', '妈妈煎了一个鸡蛋。'],
    ['香蕉', 'xiāng jiāo', 'banana', '🍌', '香蕉弯弯像月亮。'],
    ['西瓜', 'xī guā', 'watermelon', '🍉', '夏天吃西瓜真凉快。'],
    ['葡萄', 'pú tao', 'grapes', '🍇', '一串紫色的葡萄。'],
    ['草莓', 'cǎo méi', 'strawberry', '🍓', '草莓红红的。'],
    ['胡萝卜', 'hú luó bo', 'carrot', '🥕', '小兔子爱吃胡萝卜。'],
    ['番茄', 'fān qié', 'tomato', '🍅', '番茄炒鸡蛋真好吃。'],
    ['黄瓜', 'huáng guā', 'cucumber', '🥒', '黄瓜绿绿的。'],
    ['面包', 'miàn bāo', 'bread', '🍞', '面包软软的。'],
    ['奶酪', 'nǎi lào', 'cheese', '🧀', '老鼠喜欢奶酪。'],
    ['冰箱', 'bīng xiāng', 'fridge', '🧊', '冰箱里凉凉的。'],
    ['杯子', 'bēi zi', 'cup', '🥤', '我用杯子喝水。'],
    ['椅子', 'yǐ zi', 'chair', '🪑', '请坐在椅子上。'],
    ['书', 'shū', 'book', '📖', '我喜欢看书。']
  ];

  var CAT = { B: '本义', L: '生活', A: '动作', C: '反差' };

  function expand(ch) {
    var f = FAMILY[ch];
    if (!f) return null;
    return {
      char: ch, pinyin: f.py, english: f.en, source: 'builtin',
      words: f.words.map(function (w) {
        return { word: w[0], pinyin: w[1], english: w[2], cat: w[3], emoji: w[4], icon: w[5] };
      })
    };
  }

  function thing(zh) {
    for (var i = 0; i < THINGS.length; i++) if (THINGS[i][0] === zh) {
      var t = THINGS[i];
      return { zh: t[0], pinyin: t[1], en: t[2], emoji: t[3], sentence: t[4] };
    }
    return null;
  }

  return { FAMILY: FAMILY, THINGS: THINGS, CAT: CAT, expand: expand, thing: thing, chars: Object.keys(FAMILY) };
});
