import fetch from 'node-fetch'

export const retryFetch = async (url: string, options = {}, retries = 3): Promise<any> => {
  const result = await fetch(url, options)

  if(result.ok){
    return result.json();
  }

  if(retries > 0 && result.status === 429){
    const retryAfter = result.headers.get('retry-after');
    await timeout((retryAfter ? +retryAfter : 1) * 1000);
    return retryFetch(url, options, retries--);
  }else{
    return null
  }
}

function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}