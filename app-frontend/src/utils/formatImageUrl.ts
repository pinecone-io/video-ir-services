export const formatImageUrl = (url: string): string =>{
 return url.replace(/^.*server/, "http://localhost:3000");
}
