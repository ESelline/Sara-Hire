    import { auth } from "@clerk/nextjs";
    import { createUploadthing, type FileRouter } from "uploadthing/next";

    const handleAuth = ()=>{
        const {userId} = auth();
        if(!userId){
            throw new Error("unAuthorized access")
        }
        return {userId:userId}
    }
    
    const f = createUploadthing();
    
    export const ourFileRouter = {
        serverImage:f({image:{maxFileSize:"4MB",maxFileCount:1}}).middleware(()=>handleAuth()).onUploadComplete(()=>{}),
        messageFile:f(["image","pdf"]).middleware(()=>handleAuth()).onUploadComplete(()=>{})

    } satisfies FileRouter;
    
    export type OurFileRouter = typeof ourFileRouter;