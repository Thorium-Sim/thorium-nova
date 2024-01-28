export const fragment = `#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D map;
uniform float time;
uniform vec3 color1;
uniform vec3 color2;
uniform float flare1;
uniform float flare2;
uniform float flare3;
uniform float flare4;
uniform float flare5;
uniform float flare6;		
uniform float sphere;	
uniform float textureBlend;	
uniform float corona;	
uniform float glow;	
uniform float alpha;	
uniform float rotation1;	
uniform float rotation2;
uniform int iterations;
varying vec2 texcoord;
float freqs[4];

// Noise Settings
#define NoiseSteps 1
#define NoiseFrequency 4.0



vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }

vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }

vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }

vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v)
{
const vec2  C = vec2(1.0/6.0, 1.0/3.0);
const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
vec3 i  = floor(v + dot(v, C.yyy));
vec3 x0 = v - i + dot(i, C.xxx);

// Other corners
vec3 g = step(x0.yzx, x0.xyz);
vec3 l = 1.0 - g;
vec3 i1 = min(g.xyz, l.zxy);
vec3 i2 = max(g.xyz, l.zxy);
vec3 x1 = x0 - i1 + C.xxx;
vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
i = mod289(i);
vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
float n_ = 0.142857142857; // 1.0/7.0
vec3  ns = n_ * D.wyz - D.xzx;
vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

vec4 x_ = floor(j * ns.z);
vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

vec4 x = x_ *ns.x + ns.yyyy;
vec4 y = y_ *ns.x + ns.yyyy;

vec4 h = 1.0 - abs(x) - abs(y);
vec4 b0 = vec4(x.xy, y.xy);
vec4 b1 = vec4(x.zw, y.zw);

vec4 s0 = floor(b0) * 2.0 + 1.0;
vec4 s1 = floor(b1) * 2.0 + 1.0;
vec4 sh = -step(h, vec4(0.0));

vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

vec3 p0 = vec3(a0.xy, h.x);
vec3 p1 = vec3(a0.zw, h.y);
vec3 p2 = vec3(a1.xy, h.z);
vec3 p3 = vec3(a1.zw, h.w);

//Normalise gradients
vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));

p0 *= norm.x;
p1 *= norm.y;
p2 *= norm.z;
p3 *= norm.w;

// Mix final noise value
vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
m = m * m;

return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float Turbulence(vec3 position, float minFreq, float maxFreq, float qWidth)
{
float value = 0.0;
float cutoff = clamp(0.5/qWidth, 0.0, maxFreq);
float fade;
float fOut = minFreq;

for(int i=NoiseSteps ; i>=0 ; i--)
{
if(fOut >= 0.5 * cutoff) break;
fOut *= 2.0;
value += abs(snoise(position * fOut))/fOut;
}
fade = clamp(2.0 * (cutoff-fOut)/cutoff, 0.0, 1.0);
return 1.0 - value - fade * abs(snoise(position * fOut)) / fOut;
}


float snoise(vec3 uv, float res)	// by trisomie21
{
const vec3 s = vec3(1e0, 1e2, 1e4);

uv *= res;

vec3 uv0 = floor(mod(uv, res))*s;
vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;

vec3 f = fract(uv); f = f*f*(3.0-2.0*f);

vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
        uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);

vec4 r = fract(sin(v*1e-3)*1e5);
float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

r = fract(sin((v + uv1.z - uv0.z)*1e-3)*1e5);
float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

return mix(r0, r1, f.z)*2.-1.;
}

void main( void )
{
freqs[0] = 0.7;
freqs[1] = 0.3;
freqs[2] = 0.2;
freqs[3] = 0.84;

float brightness	= freqs[1] * 0.25 + freqs[2] * 0.25;
float radius		= 0.24 + brightness * 0.2;
float invRadius 	= 1.0/radius;

vec3 orange			= color1; 
vec3 orangeRed		= color2; 
float time		= time * 0.1;
float aspect	= 1.0;
vec2 uv			= texcoord;
vec2 p 			= -0.5 + uv;
p.x *= aspect;

float fade		= pow( length( 2.0 * p ), 0.5 );
float fVal1		= 1.0 - fade;
float fVal2		= 1.0 - fade;

float angle		= atan( p.x, p.y )/6.2832;
float dist		= length(p)*1.0;
float timeflare = time*mix(0.,5.,flare3);
vec3 coord		= vec3( angle*floor(flare6*10.), dist, timeflare * 0.1 );

float newTime1	= abs( snoise( coord + vec3( 0.0, -timeflare * ( 0.35 + brightness * 0.001), timeflare * 0.015), floor(flare1 * 100.0) * 1.0 ) );
float newTime2	= abs( snoise( coord + vec3( 0.0, -timeflare * ( 0.15 + brightness * 0.001), timeflare * 0.015), floor(flare1 * 100.0) * 1.0 ) );	
for( int i=1; i<=10; i++ ){
if(i>iterations) break;
float power = pow( 2.0, float(i + 1) );
fVal1 += ( 0.5 / power ) * snoise( coord + vec3( 0.0, -timeflare, timeflare * 0.2 ), ( power * ( 10.0 ) * ( newTime1 + 1.0 ) ) );
fVal2 += ( 0.5 / power ) * snoise( coord + vec3( 0.0, -timeflare, timeflare * 0.2 ), ( power * ( 25.0 ) * ( newTime2 + 1.0 ) ) );
}

float coronafx		= pow( fVal1 * max( 1.1 - fade, 0.0 ), mix(1.2,2.8,flare4)) * 50.0;
coronafx				+= pow( fVal2 * max( 1.1 - fade, 0.0 ), mix(1.2,2.8,flare5)) * 50.0;
coronafx				*= 1.2 - newTime1;
vec3 sphereNormal 	= vec3( 0.0, 0.0, 1.0 );
vec3 dir 			= vec3( 0.0 );
vec3 center			= vec3( 0.5, 0.5, 1.0 );
vec3 starSphere		= vec3( 0.0 );

vec2 sp = -1.0 + 2.0 * uv;
sp.x *= aspect;
sp *= ( 2.0 - brightness );
float r = dot(sp,sp);
float f = (1.0-sqrt(abs(1.0-r)))/(r) + brightness * 0.5;
if( dist < radius ){
coronafx			*= pow( dist * invRadius, 24.0*flare2 );
vec2 newUv;
newUv.x = sp.x*f;
newUv.y = sp.y*f;
newUv += vec2( time*0.35 * 5. * (rotation1-0.5), 0.0 );

vec3 texSample 	= texture2D( map, newUv ).rgb;
float uOff		= ( texSample.g * brightness * 4.5 + time * 5. * (rotation2-0.5) );
vec2 starUV		= newUv + vec2( uOff, 0.0 );
starSphere		= texture2D( map, starUV ).rgb;
}

float starGlow	= min( max( 1.0 - dist * ( 1.0 - brightness ), 0.0 ), 1. ) * max(0., .5 - dist) * 2.;
//fragColor.rgb	= vec3( r );
gl_FragColor.rgb	= vec3( f * ( 0.75 + brightness * 0.3 ) * orange * sphere )  + starSphere * textureBlend + 
        coronafx * orange * corona + starGlow * orangeRed * glow;
gl_FragColor.a		= alpha;
}`;

export const vertex = `varying vec2 texcoord;
void main() {
  vec4 wpos = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * wpos;
  texcoord = uv;
}`;
