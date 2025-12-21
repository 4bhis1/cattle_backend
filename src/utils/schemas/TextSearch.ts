// import mongoose, { SchemaTypeOptions } from "mongoose";
// import { indexInElastic, removeFromElastic } from "../elasticService";

// class TextSearch extends mongoose.SchemaType {
//   constructor(key: string, options: SchemaTypeOptions<any>) {
//     super(key, options, "TextSearch");

//     this.default(() => "");
//   }

//   cast(val: string): string {
//     if (typeof val !== "string") {
//       throw new Error("TextSearch must be a string.");
//     }
//     return val;
//   }

//   async indexInSearch(doc: any, field: string) {
//     if (!doc._id || !doc[field]) return;

//     try {
//       await indexInElastic({
//         index: "your_index_name",
//         id: doc._id.toString(),
//         body: { [field]: doc[field] },
//       });
//     } catch (error) {
//       console.error("Error indexing document in Elasticsearch:", error);
//     }
//   }

//   async removeFromSearch(doc: any) {
//     if (!doc._id) return;

//     try {
//       await removeFromElastic({
//         index: "your_index_name",
//         id: doc._id.toString(),
//       });
//     } catch (error) {
//       console.error("Error removing document from Elasticsearch:", error);
//     }
//   }
// }

// (mongoose.Schema.Types as any).TextSearch = TextSearch;

// export default TextSearch;
