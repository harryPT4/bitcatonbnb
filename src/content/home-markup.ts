import { openingMarkup, closingMarkup } from "./home-shell";
import { heroMarkup, gamePromoMarkup } from "./home-play";
import { marketMarkup, howMarkup, calculatorMarkup, vaultMarkup, huntMarkup, milestonesMarkup, bowlMarkup, contractMarkup } from "./home-data";
import { marqueeMarkup, storyMarkup, receiptsMarkup, faqMarkup, livesMarkup } from "./home-story";
import { communityMarkup } from "./community-markup";

// Only trusted source-controlled HTML is composed here. Never interpolate visitor input.
export const homeMarkup = [
  openingMarkup,
  heroMarkup,
  gamePromoMarkup,
  communityMarkup,
  howMarkup,
  calculatorMarkup,
  marketMarkup,
  vaultMarkup,
  huntMarkup,
  milestonesMarkup,
  bowlMarkup,
  marqueeMarkup,
  storyMarkup,
  receiptsMarkup,
  faqMarkup,
  livesMarkup,
  contractMarkup,
  closingMarkup,
].join("\n");
