//@flow weak
import GAME_SLUGS from './game_slugs';
import DESIGN_SLUGS from './design_slugs';
import { proxyToRails } from 'app-server/server/utils/common';
 
 
function matchChallengeSlug(url, slug) {
  const slugRegex = new RegExp(`challenges/${slug}($|/.*$)`);
  return !!url.match(slugRegex);
}
 
export function isGameChallenge(url) {
  return GAME_SLUGS.some(matchChallengeSlug.bind(null, url));
}
 
export function isDesignChallenge(url) {
  return DESIGN_SLUGS.some(matchChallengeSlug.bind(null, url));
}
 
export function proxyToCommunityRails(req, res) {
  proxyToRails(req, res, { port: 5000 });
}
 
export function getContextData(productNamespace, storeState) {
  const contextData = { productNamespace };
  if (productNamespace === 'hackerrankx') {
    if (storeState && storeState.work && storeState.work.user) {
      return { ...contextData, userId: storeState.work.user.id };
    }
  } else {
    if (storeState && storeState.community && storeState.community.profile) {
      return { ...contextData, username: storeState.community.profile.username };
    }
  }
}
