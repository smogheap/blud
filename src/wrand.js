/*
	Copyright (c) 2010, Micah N Gorrell
	All rights reserved.

	THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED
	WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
	MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
	EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
	PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
	WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
	OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
	ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/* Mimick the random number generator used by windows */
WRand = function()
{
	return(WRand.randint());
};

WRand.LCRand = function()
{
	var seed = WRand.getSeed(NaN);

	seed = seed * 214013 + 2531011;
	seed = seed & 4294967295;
	var r = ((seed >> 16) & 32767);

	WRand.seed = seed;

	return(r);
};
WRand.randint = WRand.LCRand;

WRand.setSeed = function(seed)
{
	if (!isNaN(seed)) {
		WRand.seed = seed;
	}

	seed = seed % 32000;

	WRand.randint	= WRand.LCRand;
	WRand.shuffle	= WRand.LCShuffle;
};

WRand.getSeed = function(seed)
{
	if (!isNaN(seed)) {
		return(seed);
	}

	if (!isNaN(WRand.seed)) {
		return(WRand.seed);
	}

	return((new Date()).getTime());
};

