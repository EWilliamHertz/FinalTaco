export const loadingTips = [
  "Double tap a card in your feed to quickly add it to your wishlist.",
  "You can switch between Magic and Pokémon at any time using the avatar menu in the navigation bar.",
  "Use the 'Binder' view to organize your collection by set or rarity.",
  "Make sure to double-check the condition of a card before offering a trade!",
  "Searching for a specific printing? Use the advanced filters in the search bar.",
  "The Market Pulse shows trending cards based on recent trades across the network.",
  "Follow legendary collectors to get notified when they add rare cards to their vault.",
  "You can tag cards directly in your posts by typing # followed by the card name.",
  "Verify your email to get a 'Verified Collector' badge on your profile.",
  "Keep your wantlist updated to get better trade matches from the community."
];

export const getRandomTip = () => {
  return loadingTips[Math.floor(Math.random() * loadingTips.length)];
};
