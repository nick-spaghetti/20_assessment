const base = "https://jservice.io/api/";
const width = 6;
const height = 5;

let categories = [];

/** Get width random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
   // ask for 100 categories [most we can ask for], so we can pick random
   let res = await axios.get(`${base}categories?count=100`);
   let catIds = res.data.map(c => c.id);
   return _.sampleSize(catIds, width);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
   let res = await axios.get(`${base}category?id=${catId}`);
   let cat = res.data;
   let allClues = cat.clues;
   let randomClues = _.sampleSize(allClues, height);
   let clues = randomClues.map(c => ({
      question: c.question,
      answer: c.answer,
      showing: null,
   }));

   return {
      title: cat.title,
      clues
   };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
   // Add row with headers for categories
   $("#jeopardy thead").empty();
   let $tr = $("<tr>");
   for (let catIdx = 0; catIdx < width; catIdx++) {
      $tr.append($("<th>").text(categories[catIdx].title));
   }
   $("#jeopardy thead").append($tr);

   // Add rows with questions for each category
   $("#jeopardy tbody").empty();
   for (let clueIdx = 0; clueIdx < height; clueIdx++) {
      let $tr = $("<tr>");
      for (let catIdx = 0; catIdx < width; catIdx++) {
         $tr.append($("<td>").attr("id", `${catIdx}-${clueIdx}`).text("?").on("click", handleClick));
      }
      $("#jeopardy tbody").append($tr);
   }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(e) {
   let id = e.target.id;
   let [catId, clueId] = id.split("-");
   let clue = categories[catId].clues[clueId];

   let msg;

   if (!clue.showing) {
      msg = clue.question;
      clue.showing = "question";
   } else if (clue.showing === "question") {
      msg = clue.answer;
      clue.showing = "answer";
   } else {
      // already showing answer; ignore
      return
   }

   // Update text of cell
   $(`#${catId}-${clueId}`).html(msg);
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

$("#start").on("click", async function setupAndStart() {
   $("#jeopardy").innerHTML = '<div id="spin-container"><i class = "fa fa-spin fa-spinner"></i> </div>';
   let catIds = await getCategoryIds();
   categories = [];
   for (let catId of catIds) {
      categories.push(await getCategory(catId));
   }
   fillTable();
})

/** On click of restart button, restart game. */

/** On page load, setup and start & add event handler for clicking clues */

$(async function () {
   setupAndStart();
   $("#jeopardy").on("click", "td", handleClick);
});