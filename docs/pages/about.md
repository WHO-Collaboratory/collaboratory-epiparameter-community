## About

### Overview

The epidemiological parameters community consist of a global collaborative working group coordinated by WHO, which aims to develop a global repository of epidemiological parameters. This repository will be publicly accessible by modellers, epidemiologists, subject matter experts and decision makers to inform mathematical models and public health response. 

Epidemiological parameters are used by mathematical models that are critical to understand the transmission dynamics of pathogens and to determine the potential impact of outbreaks in terms of morbidity, mortality, and geographical spread over time.  

Therefore, by enabling faster and more transparent insight generation at the beginning and during an outbreak, the global epidemiological parameter repository will serve as an essential global public good to inform and guide public health interventions designed to mitigate the spread of diseases and reduce their impact on affected populations.    

### Our workstreams

<div class="ws">
        <ul class="workstream">
            <li><a href="#" data-target="w1" class="active">1.<br>Prioritisation<br>&amp; definition</a></li>
            <li class="arrow">&rarr;</li>
            <li><a href="#" data-target="w2">2.<br>Extraction<br>&nbsp;</a></li>
            <li class="arrow">&rarr;</li>
            <li><a href="#" data-target="w3">3.<br>Storage<br>&amp; use</a></li>
            <li class="arrow">&rarr;</li>
            <li><a href="#" data-target="w4">4.<br>Validation<br>&amp; maintenance</a></li>
			<li class="arrow">&rarr;</li>
            <li><a href="#" data-target="w5">5.<br>Scientific<br>recognition</a></li>
        </ul>
		<div class="workstreamContent">
			<br>
			<br>
			<div id="w1" style="display:flex">This workstream will focus on the development of data taxonomy, data dictionary and model for the epidemiological parameter repository. Furthermore, we will Identify priority parameters that are needed to inform decision making across various use cases as well as required contextual information for each parameter.</div>
			<div id="w2">This workstream will focus on standardized methodologies and tools to extract parameters either retrospectively through literature review or in real-time through analysis of primary outbreak data.</div>
			<div id="w3">This workstream will focus on the identification of tools and approaches to support parameters storage in formats usable in analytical pipelines.</div>
			<div id="w4">This workstream will focus on the identification of mechanisms for validation and quality assurance of the parameters repository, as well as on sustainability models that support the continuous update of the parameters database.</div>
			<div id="w5">This workstream will focus on the identification of mechanisms for recognition of authors and contributors, as well as other incentives mechanisms for sustained contribution.</div>
		</div>
	</div>

    <script>
        document.querySelectorAll('.workstream a').forEach(link => {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                const targetId = this.getAttribute('data-target');
                const targetDiv = document.getElementById(targetId);
				
				document.querySelectorAll('.workstream a').forEach(a => {
                    a.classList.remove('active');
                });
                this.classList.add('active');

                document.querySelectorAll('.workstreamContent > div').forEach(div => {
                    if (div !== targetDiv) {
                        div.style.display = 'none';
                    }
					else {
						targetDiv.style.display = 'flex';
					}
                });
            });
        });
    </script>
 
