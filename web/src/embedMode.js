// The embed view is selected by exactly one `embed=1`. Anything else (embed=true, embed=0, a repeated embed) shows the full studio,
// which matches the server: it only allows framing for a single embed=1.
export const isEmbedRequest = (search) => {
  const all = new URLSearchParams(search).getAll("embed");
  return all.length === 1 && all[0] === "1";
};
