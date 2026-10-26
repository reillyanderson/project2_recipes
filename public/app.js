function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

async function request(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Recipes could not be loaded. Please try again.');
  return data;
}

function recipeCard(recipe) {
  const article = element('article', undefined, 'recipe-card');
  const link = element('a');
  link.href = `/recipes/${encodeURIComponent(recipe.id)}`;
  const image = element('img');
  image.src = recipe.image;
  image.alt = '';
  image.loading = 'lazy';
  image.width = 480;
  image.height = 300;
  const content = element('div', undefined, 'card-content');
  content.append(
    element('p', recipe.category, 'category'),
    element('h3', recipe.title),
    element('span', 'View recipe \u2192')
  );
  link.append(image, content);
  article.append(link);
  return article;
}

async function catalog() {
  const queries = new URLSearchParams(location.search).getAll('q');
  const query = queries[0] || '';
  document.querySelector('#recipe-search').value = query;
  if (queries.length > 1 || query.length > 100) {
    throw new Error('Enter a single search of up to 100 characters.');
  }
  const data = await request('/recipes.json');
  const terms = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const recipes = data.filter(recipe => {
    const text = `${recipe.title} ${recipe.category} ${recipe.ingredients.join(' ')}`.toLowerCase();
    return terms.every(term => text.includes(term));
  });
  document.querySelector('#status').textContent = 'Sample recipes. Search by name or ingredients, separated by spaces or commas.';
  document.querySelector('#results-heading').textContent = `${query.trim() ? 'Search results' : 'From the sample kitchen'} (${recipes.length})`;
  const results = document.querySelector('#recipes');
  results.replaceChildren(...recipes.map(recipeCard));
  if (!recipes.length) results.append(element('p', 'No recipes found. Try another name or browse all samples.'));
}

async function detail() {
  const id = location.pathname.split('/').pop();
  const recipes = await request('/recipes.json');
  const recipe = recipes.find(recipe => recipe.id === id);
  if (!recipe) throw new Error('Recipe not found. Browse the sample catalog for another idea.');
  document.title = `${recipe.title} | Gourmet Group`;
  document.querySelector('#recipe-title').textContent = recipe.title;
  document.querySelector('#recipe-category').textContent = `${recipe.category} \u00b7 ${recipe.publisher}`;
  const image = document.querySelector('#recipe-image');
  image.src = recipe.image;
  image.alt = recipe.title;
  document.querySelector('#ingredients').replaceChildren(
    ...recipe.ingredients.map(ingredient => element('li', ingredient))
  );
  document.querySelector('#instructions').replaceChildren(
    ...recipe.instructions.split(/\r?\n/).filter(line => line.trim()).map(line => element('p', line))
  );
  document.querySelector('#recipe').hidden = false;
  document.querySelector('#status').hidden = true;
}

const load = document.body.dataset.page === 'catalog' ? catalog : detail;
load().catch(error => {
  document.querySelector('#status').textContent = error.name === 'TimeoutError'
    ? 'Loading timed out. Please try again, or browse the sample catalog.'
    : error.message;
});
