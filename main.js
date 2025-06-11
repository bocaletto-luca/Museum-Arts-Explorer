 // Global Variables / Variabili Globali
    const resultsDiv = document.getElementById("results");
    const paginationNav = document.getElementById("paginationNav");
    let artworksData = [];
    let currentPage = 1;
    const pageSize = 12; // Number of artworks per page / Numero di opere per pagina

    // Event Listener for Search / Gestione dell'evento di ricerca
    document.getElementById("btnSearch").addEventListener("click", async () => {
      const query = document.getElementById("searchInput").value.trim();
      if (!query) {
        alert("Please enter a search keyword.");
        return;
      }
      resultsDiv.innerHTML = "<p>Loading artworks...</p>";
      paginationNav.innerHTML = "";
      try {
        // Call the Met's Collection API search endpoint with hasImages=true
        const searchUrl = "https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=" + encodeURIComponent(query);
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        if (!searchData.total || searchData.total === 0) {
          resultsDiv.innerHTML = "<p>No artworks found for this keyword.</p>";
          return;
        }
        // Limit results to first 50 for performance reasons
        const objectIDs = searchData.objectIDs.slice(0, 50);
        // Fetch details for each artwork concurrently
        const detailPromises = objectIDs.map(id => fetch("https://collectionapi.metmuseum.org/public/collection/v1/objects/" + id).then(res => res.json()));
        artworksData = await Promise.all(detailPromises);
        currentPage = 1;
        renderPage(currentPage);
      } catch (error) {
        console.error(error);
        resultsDiv.innerHTML = "<p>Error retrieving artworks. Please try again later.</p>";
      }
    });

    // Render a page of artworks / Funzione per visualizzare una pagina di opere
    function renderPage(page) {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageArtworks = artworksData.slice(start, end);
      displayArtworks(pageArtworks);
      renderPagination();
    }

    // Display artworks in a grid / Visualizza le opere in una griglia
    function displayArtworks(artworks) {
      let html = '<div class="row">';
      artworks.forEach(artwork => {
        // Use primaryImageSmall if available; fallback to primaryImage or a placeholder
        const thumb = artwork.primaryImageSmall || artwork.primaryImage || "https://via.placeholder.com/300x200?text=No+Image";
        html += `
          <div class="col-md-4 mb-3">
            <div class="artwork-card d-flex flex-column">
              <img src="${thumb}" alt="${artwork.title}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" />
              <div class="artwork-info">
                <div>
                  <h5 title="${artwork.title}">${artwork.title || "Unknown Title"}</h5>
                  <p>${artwork.artistDisplayName || "Unknown Artist"}</p>
                </div>
                <button class="btn btn-info btn-sm" onclick='showDetails(${JSON.stringify(artwork)})'>View Details</button>
              </div>
            </div>
          </div>
        `;
      });
      html += "</div>";
      resultsDiv.innerHTML = html;
    }

    // Render pagination controls / Renderizza i controlli di paginazione
    function renderPagination() {
      const totalPages = Math.ceil(artworksData.length / pageSize);
      if (totalPages <= 1) {
        paginationNav.innerHTML = "";
        return;
      }
      let paginationHTML = '<ul class="pagination justify-content-center">';
      // Previous button
      paginationHTML += `<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                           <button class="page-link" onclick="changePage(${currentPage - 1})">Previous</button>
                         </li>`;
      // Page numbers
      for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<li class="page-item ${currentPage === i ? "active" : ""}">
                             <button class="page-link" onclick="changePage(${i})">${i}</button>
                           </li>`;
      }
      // Next button
      paginationHTML += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
                           <button class="page-link" onclick="changePage(${currentPage + 1})">Next</button>
                         </li>`;
      paginationHTML += "</ul>";
      paginationNav.innerHTML = paginationHTML;
    }

    // Change the current page / Cambia pagina
    function changePage(page) {
      const totalPages = Math.ceil(artworksData.length / pageSize);
      if (page < 1 || page > totalPages) return;
      currentPage = page;
      renderPage(currentPage);
    }

    // Show artwork details in a fullscreen modal / Mostra i dettagli dell'opera in un modal a schermo intero
    function showDetails(artwork) {
      const imageUrl = artwork.primaryImage || "https://via.placeholder.com/600x400?text=No+Image";
      const content = `
        <div class="container-fluid">
          <div class="row">
            <div class="col-md-6">
              <img src="${imageUrl}" alt="${artwork.title}" id="detailImage" class="img-fluid" style="object-fit:contain;">
            </div>
            <div class="col-md-6">
              <h2>${artwork.title || "Unknown Title"}</h2>
              <p><strong>Artist:</strong> ${artwork.artistDisplayName || "Unknown Artist"}</p>
              <p><strong>Date:</strong> ${artwork.objectDate || "Not Available"}</p>
              <p><strong>Medium:</strong> ${artwork.medium || "Not Available"}</p>
              <p><strong>Dimensions:</strong> ${artwork.dimensions || "Not Available"}</p>
              <p><strong>Department:</strong> ${artwork.department || "Not Available"}</p>
              <p><strong>Culture:</strong> ${artwork.culture || "Not Available"}</p>
              <p><a href="${artwork.objectURL}" target="_blank" class="btn btn-primary btn-sm">More Information on The Met Website</a></p>
            </div>
          </div>
        </div>
      `;
      document.getElementById("modalDetailContent").innerHTML = content;
      const modalElem = document.getElementById("detailModal");
      const modal = new bootstrap.Modal(modalElem, { backdrop: "static" });
      modal.show();
    }
